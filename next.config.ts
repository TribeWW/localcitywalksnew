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
  /**
   * First-party PostHog EU proxy. Browser SDK uses api_host `/lcw-cobble`.
   * Static and array must stay above the catch-all so assets hit eu-assets.
   */
  async rewrites() {
    return [
      {
        source: "/lcw-cobble/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/lcw-cobble/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/lcw-cobble/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog API paths end with a slash (`/e/`, `/flags/`); avoid 308 round trips.
  skipTrailingSlashRedirect: true,
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
