import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);

    const event = await prisma.event.findUnique({ where: { id }, include: { ticketTypes: true } });
    if (!event) return errorResponse("NOT_FOUND", "Event not found.", 404);
    if (event.organizerId !== user.id && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "You cannot publish this event.", 403);
    if (event.status === "CANCELLED") return errorResponse("EVENT_CANCELLED", "A cancelled event cannot be published.", 409);
    if (event.ticketTypes.length === 0) return errorResponse("NO_TICKETS", "Add at least one ticket type first.", 400);
    if (event.endAt <= new Date()) return errorResponse("PAST_EVENT", "A past event cannot be published.", 400);

    const updated = await prisma.event.update({ where: { id }, data: { status: "PUBLISHED" } });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
