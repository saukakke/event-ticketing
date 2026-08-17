import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);

    const orders = await prisma.order.findMany({
      where: user.role === "ADMIN" ? undefined : { event: { organizerId: user.id } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, city: true, startAt: true } },
        items: { include: { ticketType: { select: { id: true, name: true, priceKobo: true } } } },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalKobo: order.totalKobo,
      currency: order.currency,
      paymentReference: order.paymentReference,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.user,
      event: order.event,
      items: order.items,
      ticketCount: order._count.tickets,
    })));
  } catch (error) {
    return handleError(error);
  }
}
