import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);
    const tickets = await prisma.ticket.findMany({
      where: user.role === "ADMIN" ? undefined : { event: { organizerId: user.id } },
      include: {
        event: { select: { id: true, title: true, city: true, startAt: true } },
        ticketType: { select: { id: true, name: true, priceKobo: true } },
        order: { select: { id: true, status: true, paymentReference: true, createdAt: true, user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(tickets);
  } catch (error) {
    return handleError(error);
  }
}
