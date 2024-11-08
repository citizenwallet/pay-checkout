import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.IPFS_DOMAIN ?? "",
        port: "",
      },
    ],
  },
};

export default nextConfig;
