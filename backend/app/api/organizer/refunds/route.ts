import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { errorResponse, handleError, ok } from "@/lib/http";
import { refundPaystackTransaction } from "@/lib/paystack";

const schema = z.object({ orderId: z.string().min(1), reason: z.string().trim().max(500).optional() });

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (!["ADMIN", "ORGANIZER"].includes(user.role)) return errorResponse("FORBIDDEN", "Organizer or admin access required.", 403);

    const { orderId, reason } = schema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { event: true, tickets: true, items: true } });
    if (!order) return errorResponse("NOT_FOUND", "Order not found.", 404);
    if (user.role === "ORGANIZER" && order.event.organizerId !== user.id) return errorResponse("FORBIDDEN", "You can only refund orders for your own events.", 403);
    if (order.status !== "PAID") return errorResponse("INVALID_ORDER_STATUS", "Only paid orders can be refunded.", 409);
    if (!order.paymentReference) return errorResponse("PAYMENT_REFERENCE_MISSING", "This order has no payment reference.", 409);

    const existing = await prisma.refund.findFirst({ where: { orderId, status: { in: ["PENDING", "PROCESSING", "PROCESSED"] } } });
    if (existing) return errorResponse("REFUND_ALREADY_REQUESTED", "A refund already exists for this order.", 409);

    const refund = await prisma.refund.create({
      data: {
        orderId,
        eventId: order.eventId,
        requestedById: user.id,
        amountKobo: order.totalKobo,
        currency: order.currency,
        reason,
        status: "PROCESSING",
      },
    });

    try {
      const provider = await refundPaystackTransaction({
        transaction: order.paymentReference,
        amountKobo: order.totalKobo,
        currency: order.currency,
      });

      const result = await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({ where: { id: orderId, status: "PAID" }, data: { status: "REFUNDED" } });
        if (claimed.count !== 1) throw new Error("ORDER_NOT_REFUNDABLE");

        for (const item of order.items) {
          await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { quantityRemaining: { increment: item.quantity } } });
        }
        await tx.ticket.updateMany({ where: { orderId }, data: { status: "VOID", checkedIn: false, checkedInAt: null } });
        return tx.refund.update({ where: { id: refund.id }, data: { status: "PROCESSED", providerReference: provider.providerReference } });
      });

      await audit(user.id, "ORDER_REFUNDED", "Order", orderId, {
        refundId: result.id,
        amountKobo: order.totalKobo,
        providerReference: provider.providerReference,
      });
      return ok(result, 200);
    } catch (error) {
      await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_REFUNDABLE") {
      return errorResponse("INVALID_ORDER_STATUS", "The order is no longer eligible for a refund.", 409);
    }
    return handleError(error);
  }
}
