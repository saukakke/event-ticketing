import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { orderSchema } from "@/lib/validation";
import { errorResponse, handleError, ok } from "@/lib/http";
import { initializePaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack";
import { finalizePaystackOrder, releaseReservedStock } from "@/lib/order-payment";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);

    const input = orderSchema.parse(await request.json());
    const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");
    if (!frontendUrl) return errorResponse("PAYMENT_CONFIGURATION_ERROR", "FRONTEND_URL is not configured.", 500);

    const prepared = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: input.eventId }, include: { ticketTypes: true } });
      if (!event || event.status !== "PUBLISHED") throw new Error("EVENT_NOT_FOUND");

      const requested = new Map(input.items.map((item) => [item.ticketTypeId, item.quantity]));
      const selected = event.ticketTypes.filter((ticket) => requested.has(ticket.id));
      if (selected.length !== input.items.length) throw new Error("INVALID_TICKET_TYPE");

      let total = 0;
      for (const ticket of selected) {
        const quantity = requested.get(ticket.id)!;
        if (ticket.quantityRemaining < quantity) throw new Error("INSUFFICIENT_STOCK");
        total += ticket.priceKobo * quantity;
      }

      const paymentReference = `EVF-${crypto.randomUUID()}`;
      const order = await tx.order.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: "PENDING",
          totalKobo: total,
          currency: "NGN",
          paymentReference,
          items: {
            create: selected.map((ticket) => ({
              ticketTypeId: ticket.id,
              quantity: requested.get(ticket.id)!,
              unitPriceKobo: ticket.priceKobo,
            })),
          },
        },
      });

      for (const ticket of selected) {
        const quantity = requested.get(ticket.id)!;
        const result = await tx.ticketType.updateMany({
          where: { id: ticket.id, quantityRemaining: { gte: quantity } },
          data: { quantityRemaining: { decrement: quantity } },
        });
        if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }

      return { order, paymentReference, totalKobo: total };
    });

    try {
      const payment = await initializePaystackTransaction({
        email: user.email,
        amountKobo: prepared.totalKobo,
        reference: prepared.paymentReference,
        callbackUrl: `${frontendUrl}/dashboard?payment=return&reference=${encodeURIComponent(prepared.paymentReference)}`,
        metadata: { orderId: prepared.order.id, eventId: prepared.order.eventId, userId: user.id },
      });

      return ok({
        orderId: prepared.order.id,
        reference: payment.reference,
        authorizationUrl: payment.authorization_url,
        accessCode: payment.access_code,
        amountKobo: prepared.totalKobo,
        currency: "NGN",
      }, 201);
    } catch (paymentError) {
      try {
        const providerTransaction = await verifyPaystackTransaction(prepared.paymentReference);
        if (providerTransaction.reference !== prepared.paymentReference) {
          return errorResponse("PAYMENT_STATUS_UNKNOWN", "The payment provider returned a mismatched transaction reference. Please check the order before retrying.", 502);
        }

        if (providerTransaction.status === "success") {
          const finalized = await finalizePaystackOrder(prepared.paymentReference);
          if (!finalized) throw new Error("PAYMENT_FINALIZATION_INCOMPLETE");
          return ok({
            orderId: finalized.id,
            reference: prepared.paymentReference,
            paymentConfirmed: true,
            status: finalized.status,
          }, 201);
        }

        await releaseReservedStock(prepared.order.id);
        return errorResponse("PAYMENT_INITIALIZATION_FAILED", "Paystack did not confirm a successful transaction. Your ticket reservation has been released.", 502);
      } catch (verificationError) {
        console.error("Unable to determine Paystack payment state after initialization failure:", verificationError);
        const message = paymentError instanceof Error ? paymentError.message : "Payment initialization failed.";
        return errorResponse("PAYMENT_STATUS_UNKNOWN", `${message} The payment provider status is currently unknown. Please check the order before retrying.`, 502);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EVENT_NOT_FOUND") return errorResponse("NOT_FOUND", "Event not found or not published.", 404);
      if (error.message === "INVALID_TICKET_TYPE") return errorResponse("INVALID_TICKET_TYPE", "One or more ticket types are invalid.", 400);
      if (error.message === "INSUFFICIENT_STOCK") return errorResponse("INSUFFICIENT_STOCK", "One or more selected ticket types are sold out.", 409);
    }
    return handleError(error);
  }
}
