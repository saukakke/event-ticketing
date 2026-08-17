import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

function positiveInt(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), maximum);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);

    const url = new URL(request.url);
    const page = positiveInt(url.searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
    const pageSize = positiveInt(url.searchParams.get("pageSize"), 20, 100);
    const q = url.searchParams.get("q")?.trim();

    const where = q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" as const } },
            { event: { title: { contains: q, mode: "insensitive" as const } } },
            { order: { user: { email: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {};

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          event: { select: { id: true, title: true } },
          ticketType: { select: { name: true } },
          order: {
            select: {
              id: true,
              status: true,
              totalKobo: true,
              paymentReference: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    return ok({ tickets, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return handleError(error);
  }
}
