import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { errorResponse, handleError, ok } from "@/lib/http";

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
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return errorResponse("PAYMENT_CONFIGURATION_ERROR", "Paystack is not configured for refunds.", 503);

    const refund = await prisma.refund.create({ data: { orderId, eventId: order.eventId, requestedById: user.id, amountKobo: order.totalKobo, currency: order.currency, reason, status: "PROCESSING" } });
    try {
      const response = await fetch("https://api.paystack.co/refund", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ transaction: order.paymentReference, amount: order.totalKobo, currency: order.currency }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.status === false) throw new Error(payload?.message || "Paystack refund failed.");
      const providerReference = payload?.data?.transaction?.reference || payload?.data?.reference || order.paymentReference;
      const result = await prisma.$transaction(async (tx) => {
        for (const item of order.items) await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { quantityRemaining: { increment: item.quantity } } });
        await tx.ticket.updateMany({ where: { orderId }, data: { status: "VOID" } });
        await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
        return tx.refund.update({ where: { id: refund.id }, data: { status: "PROCESSED", providerReference } });
      });
      await audit(user.id, "ORDER_REFUNDED", "Order", orderId, { refundId: result.id, amountKobo: order.totalKobo, providerReference });
      return ok(result, 200);
    } catch (error) {
      await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } }).catch(() => undefined);
      throw error;
    }
  } catch (error) { return handleError(error); }
}
