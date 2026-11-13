import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config PostHog proxy", () => {
  it("rewrites /lcw-cobble static and array before the catch-all to EU hosts", async () => {
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual([
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
    ]);
  });

  it("skips trailing slash redirects for PostHog API paths", () => {
    expect(nextConfig.skipTrailingSlashRedirect).toBe(true);
  });
});
