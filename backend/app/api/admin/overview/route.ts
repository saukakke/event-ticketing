import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);
    const [users, organizers, events, publishedEvents, orders, paidOrders, failedOrders, refundedOrders, tickets, checkedIn, revenue, refunds, recentOrders] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { role: "ORGANIZER" } }), prisma.event.count(), prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.order.count(), prisma.order.count({ where: { status: "PAID" } }), prisma.order.count({ where: { status: "FAILED" } }), prisma.order.count({ where: { status: "REFUNDED" } }),
      prisma.ticket.count({ where: { order: { status: "PAID" } } }), prisma.ticket.count({ where: { checkedIn: true, order: { status: "PAID" } } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalKobo: true } }), prisma.order.aggregate({ where: { status: "REFUNDED" }, _sum: { totalKobo: true } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true, email: true } }, event: { select: { title: true } } } }),
    ]);
    const gross = revenue._sum.totalKobo ?? 0; const refunded = refunds._sum.totalKobo ?? 0;
    return ok({ metrics: { users, organizers, events, publishedEvents, orders, paidOrders, failedOrders, refundedOrders, tickets, checkedIn, grossRevenueKobo: gross, refundedKobo: refunded, netRevenueKobo: Math.max(gross - refunded, 0) }, recentOrders });
  } catch (error) { return handleError(error); }
}
