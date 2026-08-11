import { NextRequest } from "next/server";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { orderSchema } from "@/lib/validation";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);

    const input = orderSchema.parse(await request.json());

    const order = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: input.eventId },
        include: { ticketTypes: true },
      });

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

      const created = await tx.order.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: "PAID",
          totalKobo: total,
          currency: "NGN",
          paymentReference: `DEMO-${crypto.randomUUID()}`,
          items: {
            create: selected.map((ticket) => ({
              ticketTypeId: ticket.id,
              quantity: requested.get(ticket.id)!,
              unitPriceKobo: ticket.priceKobo,
            })),
          },
        },
        include: { items: true },
      });

      for (const ticket of selected) {
        const quantity = requested.get(ticket.id)!;
        const result = await tx.ticketType.updateMany({
          where: { id: ticket.id, quantityRemaining: { gte: quantity } },
          data: { quantityRemaining: { decrement: quantity } },
        });
        if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }

      const ticketRows: Array<{ code: string; qrToken: string; orderId: string; eventId: string; ticketTypeId: string; qrDataUrl: string }> = [];
      for (const ticket of selected) {
        const quantity = requested.get(ticket.id)!;
        for (let i = 0; i < quantity; i++) {
          const code = `EVF-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
          const qrToken = crypto.randomUUID();
          const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ code, qrToken }));
          ticketRows.push({ code, qrToken, orderId: created.id, eventId: event.id, ticketTypeId: ticket.id, qrDataUrl });
        }
      }

      await tx.ticket.createMany({ data: ticketRows });
      return created;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { event: true, items: { include: { ticketType: true } }, tickets: true },
    });

    return ok(fullOrder, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EVENT_NOT_FOUND") return errorResponse("NOT_FOUND", "Event not found or not published.", 404);
      if (error.message === "INVALID_TICKET_TYPE") return errorResponse("INVALID_TICKET_TYPE", "One or more ticket types are invalid.", 400);
      if (error.message === "INSUFFICIENT_STOCK") return errorResponse("INSUFFICIENT_STOCK", "One or more selected ticket types are sold out.", 409);
    }
    return handleError(error);
  }
}
