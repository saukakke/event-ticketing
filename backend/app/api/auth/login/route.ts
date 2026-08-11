import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handleError, ok, errorResponse } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return errorResponse("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await setSession(publicUser);
    return ok(publicUser);
  } catch (error) {
    return handleError(error);
  }
}
