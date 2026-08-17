import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { finalizePaystackOrder } from "@/lib/order-payment";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paymentReference: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found.", 404);
    if (order.status === "PAID") return errorResponse("ALREADY_PAID", "This order is already paid.", 409);
    if (order.status !== "PENDING") {
      return errorResponse("ORDER_NOT_PENDING", "Only pending orders can be verified and marked paid.", 409);
    }
    if (!order.paymentReference) {
      return errorResponse("MISSING_PAYMENT_REFERENCE", "This order has no Paystack payment reference and cannot be verified.", 422);
    }

    const finalized = await finalizePaystackOrder(order.paymentReference);

    if (!finalized) {
      return errorResponse("PAYMENT_VERIFICATION_INCOMPLETE", "The payment could not be finalized. Please verify the transaction again.", 409);
    }

    if (finalized.status !== "PAID") {
      return errorResponse("PAYMENT_NOT_SUCCESSFUL", "Paystack has not confirmed a successful payment for this order.", 409);
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "ADMIN_VERIFY_PAYMENT",
        entity: "Order",
        entityId: order.id,
        metadata: {
          paymentReference: order.paymentReference,
          resultingStatus: finalized.status,
        },
      },
    });

    return ok({ data: finalized, message: "Payment verified and order marked as paid. Tickets have been issued." });
  } catch (error) {
    return handleError(error);
  }
}
