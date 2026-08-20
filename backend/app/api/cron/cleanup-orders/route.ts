import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { finalizePaystackOrder, releaseReservedStock } from "@/lib/order-payment";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { errorResponse, handleError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

function getPendingOrderTtlMinutes() {
  const configured = Number.parseInt(process.env.PENDING_ORDER_TTL_MINUTES || "15", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 15;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return errorResponse("UNAUTHORIZED", "Invalid cron authorization.", 401);
  }

  try {
    const cutoff = new Date(Date.now() - getPendingOrderTtlMinutes() * 60_000);
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        paymentReference: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    let released = 0;
    let finalized = 0;
    let skipped = 0;
    const errors: Array<{ orderId: string; message: string }> = [];

    for (const order of pendingOrders) {
      if (!order.paymentReference) {
        await releaseReservedStock(order.id);
        released += 1;
        continue;
      }

      try {
        const transaction = await verifyPaystackTransaction(order.paymentReference);

        if (transaction.reference !== order.paymentReference) {
          throw new Error("PAYMENT_REFERENCE_MISMATCH");
        }

        if (transaction.status === "success") {
          await finalizePaystackOrder(order.paymentReference);
          finalized += 1;
          continue;
        }

        await releaseReservedStock(order.id);
        released += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to determine payment status.";
        errors.push({ orderId: order.id, message });
        skipped += 1;
      }
    }

    return ok({
      success: true,
      processed: pendingOrders.length,
      finalized,
      released,
      skipped,
      errors,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
