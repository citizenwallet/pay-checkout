import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "content-type",
            value: "application/json; charset=utf-8",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/favicon/:accountOrUsername",
        destination: "/api/favicon/:accountOrUsername",
      },
      {
        source: "/favicon/:accountOrUsername.ico",
        destination: "/api/favicon/:accountOrUsername",
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(process.env.IPFS_DOMAIN ? [{
        protocol: "https" as const,
        hostname: process.env.IPFS_DOMAIN,
        port: "",
      }] : []),
      ...(process.env.ASSETS_DOMAIN ? [{
        protocol: "https" as const,
        hostname: process.env.ASSETS_DOMAIN,
        port: "",
      }] : []),
      ...(process.env.SUPABASE_BUCKET_DOMAIN ? [{
        protocol: "https" as const,
        hostname: process.env.SUPABASE_BUCKET_DOMAIN,
        port: "",
        pathname: "**",
      }] : []),
    ],
  },
};

export default nextConfig;
