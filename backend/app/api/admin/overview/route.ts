import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);

    const [
      users,
      organizers,
      events,
      orders,
      tickets,
      paidRevenue,
      refundedRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.event.count(),
      prisma.order.count(),
      prisma.ticket.count(),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalKobo: true } }),
      prisma.refund.aggregate({ where: { status: "PROCESSED" }, _sum: { amountKobo: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, title: true } },
        },
      }),
    ]);

    const grossRevenueKobo = paidRevenue._sum.totalKobo ?? 0;
    const refundedKobo = refundedRevenue._sum.amountKobo ?? 0;

    return ok({
      metrics: {
        users,
        organizers,
        events,
        orders,
        tickets,
        grossRevenueKobo,
        refundedKobo,
        netRevenueKobo: Math.max(grossRevenueKobo - refundedKobo, 0),
      },
      recentOrders,
    });
  } catch (error) {
    return handleError(error);
  }
}
