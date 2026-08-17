import crypto from "node:crypto";
import QRCode from "qrcode";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";

export async function releaseReservedStock(orderId: string) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order || order.status !== "PENDING") return order;
      const claimed = await tx.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "FAILED" } });
      if (claimed.count !== 1) return tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      for (const item of order.items) {
        await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { quantityRemaining: { increment: item.quantity } } });
      }
      return tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    },
    { timeout: 15000 }
  );
}

async function issueTickets(tx: Prisma.TransactionClient, orderId: string) {
  const existing = await tx.ticket.count({ where: { orderId } });
  if (existing > 0) return;
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const rows: Array<{ code: string; qrToken: string; orderId: string; eventId: string; ticketTypeId: string; qrDataUrl: string }> = [];
  for (const item of order.items) {
    for (let index = 0; index < item.quantity; index += 1) {
      const code = `EVF-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
      const qrToken = crypto.randomUUID();
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ code, qrToken }));
      rows.push({ code, qrToken, orderId: order.id, eventId: order.eventId, ticketTypeId: item.ticketTypeId, qrDataUrl });
    }
  }
  if (rows.length > 0) await tx.ticket.createMany({ data: rows });
}

export async function finalizePaystackOrder(reference: string) {
  const transaction = await verifyPaystackTransaction(reference);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { paymentReference: reference }, include: { items: true } });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (transaction.reference !== reference) throw new Error("PAYMENT_REFERENCE_MISMATCH");
    if (transaction.currency !== order.currency) throw new Error("PAYMENT_CURRENCY_MISMATCH");
    if (transaction.amount !== order.totalKobo) throw new Error("PAYMENT_AMOUNT_MISMATCH");

    if (transaction.status !== "success") {
      if (order.status === "PENDING") {
        const claimed = await tx.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "FAILED" } });
        if (claimed.count === 1) for (const item of order.items) await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { quantityRemaining: { increment: item.quantity } } });
      }
      return tx.order.findUnique({ where: { id: order.id }, include: { event: true, items: { include: { ticketType: true } }, tickets: true } });
    }

    if (order.status === "PAID") return tx.order.findUnique({ where: { id: order.id }, include: { event: true, items: { include: { ticketType: true } }, tickets: true } });
    if (order.status !== "PENDING") throw new Error("ORDER_NOT_PAYABLE");

    const claimed = await tx.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "PAID" } });
    if (claimed.count !== 1) {
      const current = await tx.order.findUnique({ where: { id: order.id }, include: { event: true, items: { include: { ticketType: true } }, tickets: true } });
      if (current?.status === "PAID") return current;
      throw new Error("ORDER_NOT_PAYABLE");
    }
    await issueTickets(tx, order.id);
    return tx.order.findUnique({ where: { id: order.id }, include: { event: true, items: { include: { ticketType: true } }, tickets: true } });
  }, { timeout: 15000 });
}
