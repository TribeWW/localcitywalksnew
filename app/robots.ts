import type { MetadataRoute } from "next";

import { buildRobotsConfig } from "@/lib/sitemap/build-robots-config";

/** Crawl policy for public pages; blocks studio, checkout, preview, and internals. */
export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig();
}
