import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
type OrderStatusValue = (typeof ORDER_STATUSES)[number];

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
    const statusParam = url.searchParams.get("status")?.trim().toUpperCase();
    const q = url.searchParams.get("q")?.trim();

    if (statusParam && !ORDER_STATUSES.includes(statusParam as OrderStatusValue)) {
      return errorResponse("INVALID_STATUS", "Payment status must be PENDING, PAID, FAILED, or REFUNDED.", 400);
    }

    const status = statusParam as OrderStatusValue | undefined;
    const where = {
      paymentReference: { not: null },
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { paymentReference: { contains: q, mode: "insensitive" as const } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
              { event: { title: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [payments, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          totalKobo: true,
          currency: true,
          paymentReference: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({ payments, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return handleError(error);
  }
}
