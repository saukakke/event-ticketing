import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

const ALLOWED_STATUSES = ["ACTIVE", "VOID"] as const;
type TicketStatusValue = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);

    const { id } = await context.params;
    const body = await request.json().catch(() => null) as { status?: string; reason?: string } | null;
    const status = body?.status?.toUpperCase() as TicketStatusValue | undefined;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return errorResponse("INVALID_STATUS", "Ticket status must be ACTIVE or VOID.", 400);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, status: true } },
        event: { select: { id: true, title: true, status: true } },
      },
    });

    if (!ticket) return errorResponse("NOT_FOUND", "Ticket not found.", 404);

    if (status === "ACTIVE" && (ticket.order.status !== "PAID" || ticket.event.status === "CANCELLED")) {
      return errorResponse(
        "TICKET_NOT_ACTIVATABLE",
        "Only tickets belonging to paid orders for non-cancelled events can be activated.",
        409,
      );
    }

    if (ticket.status === status) return ok(ticket);

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.ticket.update({
        where: { id },
        data: status === "VOID"
          ? { status, checkedIn: false, checkedInAt: null }
          : { status },
        include: {
          event: { select: { id: true, title: true } },
          ticketType: { select: { id: true, name: true } },
          order: { select: { id: true, status: true, paymentReference: true, user: { select: { id: true, name: true, email: true } } } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "TICKET_STATUS_UPDATED",
          entity: "Ticket",
          entityId: id,
          metadata: {
            previousStatus: ticket.status,
            status,
            reason: body?.reason?.trim() || null,
          },
        },
      });

      return next;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
