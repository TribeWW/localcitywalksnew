/**
 * robots.txt configuration aligned with {@link SITE_URL}.
 */

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Paths that must not be crawled (non-indexable or internal). */
export const ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/server/",
  "/lib/",
  "/constants/",
  "/node_modules/",
  "/_next/",
  "/studio/",
  "/checkout",
  "/preview/",
] as const;

/**
 * Builds the site robots policy for {@link app/robots.ts}.
 *
 * Sitemap URL uses the canonical www origin from {@link absoluteUrl}.
 */
export function buildRobotsConfig(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
