/**
 * Pure builders for Next.js sitemap entries (static routes + Bokun tour catalog).
 */

import type { MetadataRoute } from "next";
import { absoluteUrl, tourPageUrl } from "@/lib/site";
import type { CityCardData } from "@/types/bokun";

/** Fixed last-modified timestamp for deterministic tests. */
export type SitemapBuildOptions = {
  now?: Date;
};

/**
 * Sitemap entries for indexable static pages (home and explore).
 *
 * Excludes checkout, preview, studio, and API routes by design.
 */
export function buildStaticSitemapEntries(
  options: SitemapBuildOptions = {},
): MetadataRoute.Sitemap {
  const now = options.now ?? new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/explore"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}

/**
 * Sitemap entries for tour detail pages from explore catalog rows.
 *
 * Skips rows without `citySlug` / `slug` and deduplicates by canonical URL.
 */
export function buildTourSitemapEntries(
  items: CityCardData[],
  options: SitemapBuildOptions = {},
): MetadataRoute.Sitemap {
  const now = options.now ?? new Date();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const item of items) {
    const citySlug = item.citySlug?.trim();
    const slug = item.slug?.trim();
    if (!citySlug || !slug) continue;

    const url = tourPageUrl(citySlug, slug);
    if (seen.has(url)) continue;
    seen.add(url);

    entries.push({
      url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}

/**
 * Merges static routes with all tour detail URLs for {@link app/sitemap.ts}.
 */
export function buildFullSitemapEntries(
  items: CityCardData[],
  options: SitemapBuildOptions = {},
): MetadataRoute.Sitemap {
  return [
    ...buildStaticSitemapEntries(options),
    ...buildTourSitemapEntries(items, options),
  ];
}
