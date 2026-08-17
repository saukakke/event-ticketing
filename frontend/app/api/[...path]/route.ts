import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendUrl() {
  const value = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!value) {
    throw new Error("BACKEND_URL is required for the frontend runtime. Set BACKEND_URL on the frontend Render service.");
  }

  return value.replace(/\/$/, "");
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const backendUrl = getBackendUrl();
    const target = `${backendUrl}/api/${path.join("/")}${request.nextUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);

    // Forward authentication cookies from the backend to the frontend origin.
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie.replace(/Domain=[^;]+;?\s*/gi, ""));
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach backend.";
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message } },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
