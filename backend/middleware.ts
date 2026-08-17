import { NextRequest, NextResponse } from "next/server";

const allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const allowedHeaders = "Content-Type, Authorization";
const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FRONTEND_URL = "https://event-ticketing-x3og.onrender.com";

function getAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (origin === FRONTEND_URL) return origin;
  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
    } catch { return null; }
  }
  return null;
}

function isWebhookPath(pathname: string) {
  return pathname === "/api/payments/paystack/webhook";
}

function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (!origin) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", allowedMethods);
  response.headers.set("Access-Control-Allow-Headers", allowedHeaders);
  response.headers.append("Vary", "Origin");
  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(request);
  const webhook = isWebhookPath(request.nextUrl.pathname);

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigin && !webhook) {
      return NextResponse.json({ error: { code: "FORBIDDEN_ORIGIN", message: "Request origin is not allowed." } }, { status: 403 });
    }
    return addCorsHeaders(new NextResponse(null, { status: 204 }), allowedOrigin);
  }

  if (stateChangingMethods.has(request.method) && !webhook && origin && !allowedOrigin) {
    return addCorsHeaders(NextResponse.json({ error: { code: "FORBIDDEN_ORIGIN", message: "Request origin is not allowed." } }, { status: 403 }), null);
  }
  return addCorsHeaders(NextResponse.next(), allowedOrigin);
}

export const config = { matcher: ["/api/:path*"] };
