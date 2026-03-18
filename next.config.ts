import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "imgcdn.bokun.tools",
      },
      {
        protocol: "https",
        hostname: "bokun.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
