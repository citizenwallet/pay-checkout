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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.IPFS_DOMAIN ?? "",
        port: "",
      },
      {
        protocol: "https",
        hostname: process.env.ASSETS_DOMAIN ?? "",
        port: "",
      },
      {
        protocol: "https",
        hostname: process.env.SUPABASE_BUCKET_DOMAIN ?? "",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
