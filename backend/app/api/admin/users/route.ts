import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

const ROLES = ["ATTENDEE", "ORGANIZER", "ADMIN"] as const;
type RoleValue = (typeof ROLES)[number];
const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "DELETED", "ALL"] as const;
type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

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
    const roleParam = url.searchParams.get("role")?.trim().toUpperCase();
    const statusParam = (url.searchParams.get("status") || "ACTIVE").trim().toUpperCase();

    if (roleParam && !ROLES.includes(roleParam as RoleValue)) {
      return errorResponse("INVALID_ROLE", "Role must be ATTENDEE, ORGANIZER, or ADMIN.", 400);
    }
    if (!ACCOUNT_STATUSES.includes(statusParam as AccountStatus)) {
      return errorResponse("INVALID_STATUS", "Account status must be ACTIVE, SUSPENDED, DELETED, or ALL.", 400);
    }

    const role = roleParam as RoleValue | undefined;
    const status = statusParam as AccountStatus;
    const where = {
      ...(role ? { role } : {}),
      ...(status === "SUSPENDED"
        ? { suspendedAt: { not: null }, deletedAt: null }
        : status === "DELETED"
          ? { deletedAt: { not: null } }
          : status === "ALL"
            ? {}
            : { deletedAt: null, suspendedAt: null }),
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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          suspendedAt: true,
          suspensionReason: true,
          deletedAt: true,
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

    return ok({ users, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return handleError(error);
  }
}
