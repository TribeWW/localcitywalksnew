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
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@vercel\/flags-core/,
        message: /@vercel\/flags-definitions/,
      },
    ];
    return config;
  },
};

export default nextConfig;
