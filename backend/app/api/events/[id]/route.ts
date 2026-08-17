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
    if (nextEndAt <= nextStartAt) {
      return errorResponse("VALIDATION_ERROR", "End time must be after start time.", 400);
    }

    const updated = await prisma.event.update({ where: { id }, data: input });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
