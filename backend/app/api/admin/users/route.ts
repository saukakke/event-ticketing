import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") || 20), 1), 100);
    const q = url.searchParams.get("q")?.trim();
    const role = url.searchParams.get("role");
    const where = {
      ...(role && ["ATTENDEE", "ORGANIZER", "ADMIN"].includes(role) ? { role: role as any } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { id: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { events: true, orders: true, auditLogs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return ok({ data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return handleError(error);
  }
}
