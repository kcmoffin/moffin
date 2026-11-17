import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    const cleanBackendUrl = backendUrl.replace(/\/+$/, "");
    return [
      {
        source: "/auth/:path*",
        destination: `${cleanBackendUrl}/auth/:path*`,
      },
      {
        source: "/users/:path*",
        destination: `${cleanBackendUrl}/users/:path*`,
      },
      {
        source: "/category/:path*",
        destination: `${cleanBackendUrl}/category/:path*`,
      },
      {
        source: "/fishes/:path*",
        destination: `${cleanBackendUrl}/fishes/:path*`,
      },
      {
        source: "/orders/:path*",
        destination: `${cleanBackendUrl}/orders/:path*`,
      },
      {
        source: "/suppliers/:path*",
        destination: `${cleanBackendUrl}/suppliers/:path*`,
      },
      {
        source: "/buyers/:path*",
        destination: `${cleanBackendUrl}/buyers/:path*`,
      },
    ];
  },
};

export default nextConfig;
