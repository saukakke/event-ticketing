import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { errorResponse, handleError, ok } from "@/lib/http";

const schema = z.object({ code: z.string().trim().min(3).max(200) });

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (!["ORGANIZER", "ADMIN"].includes(user.role)) return errorResponse("FORBIDDEN", "Organizer or admin access required.", 403);
    const input = schema.parse(await request.json());
    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ code: input.code }, { qrToken: input.code }] },
      include: { event: true, ticketType: true, order: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!ticket) return errorResponse("TICKET_NOT_FOUND", "Ticket was not found.", 404);
    if (user.role === "ORGANIZER" && ticket.event.organizerId !== user.id) return errorResponse("FORBIDDEN", "You can only check in tickets for your own events.", 403);
    if (ticket.order.status !== "PAID") return errorResponse("PAYMENT_REQUIRED", "Only paid tickets can be checked in.", 409);
    if (ticket.event.status === "CANCELLED") return errorResponse("EVENT_CANCELLED", "This event has been cancelled.", 409);
    if (ticket.checkedIn) return errorResponse("ALREADY_CHECKED_IN", `Ticket was already checked in at ${ticket.checkedInAt?.toISOString() ?? "an earlier time"}.`, 409, { ticketId: ticket.id });

    const updated = await prisma.ticket.updateMany({ where: { id: ticket.id, checkedIn: false }, data: { checkedIn: true, checkedInAt: new Date() } });
    if (updated.count !== 1) return errorResponse("ALREADY_CHECKED_IN", "Ticket was checked in by another scan.", 409);
    const result = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id }, include: { event: true, ticketType: true, order: { include: { user: { select: { name: true, email: true } } } } } });
    await audit(user.id, "TICKET_CHECKED_IN", "Ticket", result.id, { eventId: result.eventId, orderId: result.orderId });
    return ok({ id: result.id, code: result.code, checkedIn: result.checkedIn, checkedInAt: result.checkedInAt, event: result.event, ticketType: result.ticketType, holder: result.order.user }, 200);
  } catch (error) { return handleError(error); }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (!["ORGANIZER", "ADMIN"].includes(user.role)) return errorResponse("FORBIDDEN", "Organizer or admin access required.", 403);
    const events = await prisma.event.findMany({ where: user.role === "ADMIN" ? undefined : { organizerId: user.id }, select: { id: true, title: true, startAt: true, status: true, _count: { select: { tickets: true } } }, orderBy: { startAt: "desc" } });
    const eventIds = events.map((e) => e.id);
    const [checkedIn, totalPaid] = await Promise.all([
      prisma.ticket.count({ where: { eventId: { in: eventIds }, checkedIn: true, order: { status: "PAID" } } }),
      prisma.ticket.count({ where: { eventId: { in: eventIds }, order: { status: "PAID" } } }),
    ]);
    const recent = await prisma.ticket.findMany({ where: { eventId: { in: eventIds }, checkedIn: true }, include: { event: { select: { id: true, title: true } }, ticketType: { select: { name: true } }, order: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { checkedInAt: "desc" }, take: 20 });
    return ok({ events, checkedIn, totalPaid, remaining: Math.max(totalPaid - checkedIn, 0), recent });
  } catch (error) { return handleError(error); }
}
