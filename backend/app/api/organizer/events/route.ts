import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);

    const events = await prisma.event.findMany({
      where: user.role === "ADMIN" ? undefined : { organizerId: user.id },
      include: {
        ticketTypes: true,
        orders: { where: { status: "PAID" }, select: { totalKobo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(events.map((event) => ({
      ...event,
      salesKobo: event.orders.reduce((sum, order) => sum + order.totalKobo, 0),
      ordersCount: event.orders.length,
    })));
  } catch (error) {
    return handleError(error);
  }
}
