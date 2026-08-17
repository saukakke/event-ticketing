import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "REFUNDED", "FAILED"] },
        ...(user.role === "ADMIN" ? {} : { event: { organizerId: user.id } }),
      },
      select: {
        id: true,
        status: true,
        totalKobo: true,
        currency: true,
        paymentReference: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return ok(orders.map((order) => ({ ...order, ticketCount: order._count.tickets })));
  } catch (error) {
    return handleError(error);
  }
}
