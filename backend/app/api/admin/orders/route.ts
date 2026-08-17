import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);
    const url = new URL(request.url); const page = Math.max(Number(url.searchParams.get("page") || 1), 1); const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") || 20), 1), 100); const status = url.searchParams.get("status") || undefined; const q = url.searchParams.get("q")?.trim();
    const where = { ...(status ? { status: status as any } : {}), ...(q ? { OR: [{ id: { contains: q, mode: "insensitive" as const } }, { paymentReference: { contains: q, mode: "insensitive" as const } }, { user: { email: { contains: q, mode: "insensitive" as const } } }, { event: { title: { contains: q, mode: "insensitive" as const } } }] } : {}) };
    const [data, total] = await Promise.all([prisma.order.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, event: { select: { id: true, title: true } }, items: { include: { ticketType: { select: { name: true } } } }, tickets: { select: { id: true, code: true, status: true, checkedIn: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]);
    return ok({ data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return handleError(error); }
}
