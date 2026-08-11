import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        event: true,
        tickets: true,
        items: { include: { ticketType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(orders);
  } catch (error) {
    return handleError(error);
  }
}
