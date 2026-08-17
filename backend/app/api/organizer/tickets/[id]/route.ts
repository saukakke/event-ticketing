import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);
    const { id } = await params;
    const ticket = await prisma.ticket.findFirst({
      where: { id, ...(user.role === "ADMIN" ? {} : { event: { organizerId: user.id } }) },
      include: {
        event: true,
        ticketType: true,
        order: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!ticket) return errorResponse("NOT_FOUND", "Ticket not found.", 404);
    return ok(ticket);
  } catch (error) {
    return handleError(error);
  }
}
