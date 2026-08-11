import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handleError, ok, errorResponse } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { setSession, type AuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());
    const email = input.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse("EMAIL_EXISTS", "An account with this email already exists.", 409);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email, passwordHash, role: "ATTENDEE" },
      select: { id: true, name: true, email: true, role: true },
    });

    await setSession(user as AuthUser);
    return ok(user, 201);
  } catch (error) {
    return handleError(error);
  }
}
