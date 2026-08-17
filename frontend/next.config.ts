import type { NextConfig } from "next";
const backendUrl = (process.env.BACKEND_URL || "http://localhost:10000").replace(/\/$/, "");
const nextConfig: NextConfig = { poweredByHeader: false, reactStrictMode: true, async rewrites() { return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }]; } };
export default nextConfig;
