import type { NextConfig } from "next";

const backendUrl = (
  process.env.BACKEND_URL || "https://event-ticketing-backend-yzzr.onrender.com"
).replace(/\/$/, "");

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
