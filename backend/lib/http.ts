import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status }
  );
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse("VALIDATION_ERROR", "Request validation failed.", 400, error.flatten());
  }
  console.error(error);
  return errorResponse("INTERNAL_ERROR", "An unexpected server error occurred.", 500);
}
