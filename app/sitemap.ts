import type { MetadataRoute } from "next";

import { getExploreCatalogForStructuredData } from "@/lib/explore-catalog";
import {
  buildFullSitemapEntries,
  buildStaticSitemapEntries,
} from "@/lib/sitemap/build-sitemap-entries";

/**
 * Builds the sitemap for https://www.localcitywalks.com.
 *
 * Includes home, explore, and every tour detail page from the Bokun catalog.
 * Falls back to static routes only when the catalog fetch fails.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getExploreCatalogForStructuredData();

  if (!catalog.success) {
    console.error("[sitemap] catalog fetch failed:", catalog.error);
    return buildStaticSitemapEntries();
  }

  return buildFullSitemapEntries(catalog.items);
}
