import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { finalizePaystackOrder } from "@/lib/order-payment";
import { errorResponse, handleError, ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) return errorResponse("INVALID_REFERENCE", "Payment reference is required.", 400);
  try {
    const order = await prisma.order.findUnique({ where: { paymentReference: reference }, select: { userId: true } });
    if (!order) return errorResponse("NOT_FOUND", "Payment order not found.", 404);
    if (order.userId !== user.id) return errorResponse("FORBIDDEN", "You cannot access this payment.", 403);
    const finalized = await finalizePaystackOrder(reference);
    return ok(finalized);
  } catch (error) {
    return handleError(error);
  }
}
