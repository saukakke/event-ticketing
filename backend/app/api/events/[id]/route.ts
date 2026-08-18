import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validation";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: { orderBy: { priceKobo: "asc" } },
        organizer: { select: { name: true } },
      },
    });
    if (!event || event.status !== "PUBLISHED") return errorResponse("NOT_FOUND", "Event not found.", 404);
    return ok(event);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return errorResponse("NOT_FOUND", "Event not found.", 404);
    if (event.organizerId !== user.id && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "You cannot edit this event.", 403);

    const input = updateEventSchema.parse(await request.json());
    const nextStartAt = input.startAt ?? event.startAt;
    const nextEndAt = input.endAt ?? event.endAt;
    if (nextEndAt <= nextStartAt) return errorResponse("VALIDATION_ERROR", "End time must be after start time.", 400);

    const updated = await prisma.event.update({ where: { id }, data: input });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") return errorResponse("FORBIDDEN", "Only administrators and organizers can delete events.", 403);

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, organizerId: true },
    });
    if (!event) return errorResponse("NOT_FOUND", "Event not found.", 404);
    if (user.role === "ORGANIZER" && event.organizerId !== user.id) return errorResponse("FORBIDDEN", "You can only delete your own events.", 403);

    const [orderCount, ticketCount, refundCount] = await Promise.all([
      prisma.order.count({ where: { eventId: id } }),
      prisma.ticket.count({ where: { eventId: id } }),
      prisma.refund.count({ where: { eventId: id } }),
    ]);

    // Financial and attendance records use restrictive relations, so an event with
    // transaction history is cancelled/hidden rather than destroying those records.
    if (orderCount > 0 || ticketCount > 0 || refundCount > 0) {
      const updated = await prisma.event.update({
        where: { id },
        data: { status: "CANCELLED" },
        select: { id: true, title: true, status: true },
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "EVENT_CANCELLED",
          entity: "Event",
          entityId: id,
          metadata: { reason: "Delete requested for event with transactional history", orderCount, ticketCount, refundCount },
        },
      });
      return ok({ ...updated, deleted: false, archived: true, message: "This event has transaction history, so it was cancelled and removed from public listings instead of being permanently deleted." });
    }

    await prisma.event.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "EVENT_DELETED",
        entity: "Event",
        entityId: id,
        metadata: { title: event.title },
      },
    });

    return ok({ id, title: event.title, deleted: true, archived: false, message: "Event deleted successfully." });
  } catch (error) {
    return handleError(error);
  }
}
