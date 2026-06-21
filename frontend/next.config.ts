import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,

  /**
   * Proxy all /api/* calls to the FastAPI backend.
   * This runs server-side in Next.js so there is NO cross-origin
   * request from the browser — CORS is irrelevant.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

