import type { NextConfig } from "next";

// Render exposes service environment variables during the build. Support the
// server-only BACKEND_URL as the preferred variable and NEXT_PUBLIC_BACKEND_URL
// as a compatibility fallback for frontend deployments.
const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL)?.replace(/\/$/, "");

if (!backendUrl) {
  throw new Error(
    "BACKEND_URL is required for the frontend. Set BACKEND_URL on the frontend Render service."
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
