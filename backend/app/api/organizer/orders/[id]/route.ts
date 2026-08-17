import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, ...(user.role === "ADMIN" ? {} : { event: { organizerId: user.id } }) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, venue: true, city: true, startAt: true, endAt: true } },
        items: { include: { ticketType: true } },
        tickets: { select: { id: true, code: true, qrToken: true, checkedIn: true, checkedInAt: true, createdAt: true, ticketType: { select: { id: true, name: true } } } },
      },
    });
    if (!order) return errorResponse("NOT_FOUND", "Order not found.", 404);
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
