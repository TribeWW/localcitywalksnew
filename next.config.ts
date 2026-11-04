import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
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
      {
        protocol: "https",
        hostname: "bokundemo.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.gumlet.io",
      },
    ],
  },
  /**
   * Old city slugs produced before Latin letter folding (ø→o, ł→l).
   * Keep permanent so search engines and shared links land on the corrected paths.
   */
  async redirects() {
    return [
      {
        source: "/tours/troms/:path*",
        destination: "/tours/tromso/:path*",
        permanent: true,
      },
      {
        source: "/tours/wroc-aw/:path*",
        destination: "/tours/wroclaw/:path*",
        permanent: true,
      },
    ];
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
