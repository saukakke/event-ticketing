import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import {
  handleError,
  ok,
  errorResponse,
} from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { setSession, type AuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return errorResponse(
        "EMAIL_EXISTS",
        "An account with this email already exists.",
        409
      );
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      12
    );

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await setSession(authUser);

    return ok(authUser, 201);
  } catch (error) {
    return handleError(error);
  }
}
