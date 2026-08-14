import { NextRequest, NextResponse } from "next/server";

const allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const allowedHeaders = "Content-Type, Authorization";

function getAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const configuredOrigins =
    process.env.FRONTEND_URL?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  if (configuredOrigins.includes(origin)) {
    return origin;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    origin.includes("localhost")
  ) {
    return origin;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const origin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, {
      status: origin ? 204 : 403,
    });

    if (origin) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        origin
      );

      response.headers.set(
        "Access-Control-Allow-Credentials",
        "true"
      );

      response.headers.set(
        "Access-Control-Allow-Methods",
        allowedMethods
      );

      response.headers.set(
        "Access-Control-Allow-Headers",
        allowedHeaders
      );

      response.headers.set("Vary", "Origin");
    }

    return response;
  }

  const response = NextResponse.next();

  if (origin) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      origin
    );

    response.headers.set(
      "Access-Control-Allow-Credentials",
      "true"
    );

    response.headers.set("Access-Control-Allow-Methods", allowedMethods);

    response.headers.set(
      "Access-Control-Allow-Headers",
      allowedHeaders
    );

    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
