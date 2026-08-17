import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handleError, ok, errorResponse } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, email: true, passwordHash: true, role: true, suspendedAt: true, suspensionReason: true, deletedAt: true },
    });

    if (!user || user.deletedAt) return errorResponse("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    if (user.suspendedAt) return errorResponse("ACCOUNT_SUSPENDED", user.suspensionReason ? `This account is suspended: ${user.suspensionReason}` : "This account is suspended.", 403);

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) return errorResponse("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);

    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await setSession(publicUser);
    return ok(publicUser);
  } catch (error) {
    return handleError(error);
  }
}
