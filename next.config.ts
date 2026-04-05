import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BETTER_AUTH_URL:
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;