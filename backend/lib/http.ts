import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      data,
    },
    {
      status,
    }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    {
      status,
    }
  );
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Request validation failed.",
      400,
      error.flatten()
    );
  }

  console.error("API Error:", error);

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    const prismaCode = error.code;

    switch (prismaCode) {
      case "P2002":
        return errorResponse(
          "DUPLICATE_RESOURCE",
          "A record with the supplied unique value already exists.",
          409
        );

      case "P2025":
        return errorResponse(
          "NOT_FOUND",
          "The requested record was not found.",
          404
        );

      case "P2003":
        return errorResponse(
          "FOREIGN_KEY_ERROR",
          "The request references a record that does not exist.",
          400
        );

      case "P2021":
        return errorResponse(
          "DATABASE_TABLE_MISSING",
          "A required database table does not exist. Run the Prisma migrations.",
          500
        );

      case "P2022":
        return errorResponse(
          "DATABASE_COLUMN_MISSING",
          "A required database column does not exist. Run the Prisma migrations.",
          500
        );
    }
  }

  return errorResponse(
    "INTERNAL_ERROR",
    "An unexpected server error occurred.",
    500
  );
}
