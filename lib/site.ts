/**
 * Canonical site URL helpers for metadata, JSON-LD, and sitemap generation.
 *
 * Centralizes the production origin so Next.js `metadataBase`, Open Graph tags,
 * and structured data all resolve to the same absolute URLs.
 */

/** Production site origin (no trailing slash). */
export const SITE_URL = "https://www.localcitywalks.com";

/**
 * Resolves a site-relative path to an absolute URL on {@link SITE_URL}.
 *
 * @param path - Path with or without a leading slash (e.g. `"/explore"` or `"explore"`).
 *               Whitespace is trimmed. Empty string yields the bare origin; `"/"` yields
 *               the origin with a trailing slash.
 * @returns Absolute URL string, e.g. `https://www.localcitywalks.com/explore`
 */
export function absoluteUrl(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "") {
    return SITE_URL;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${SITE_URL}${normalized}`;
}

/**
 * Builds the canonical absolute URL for a tour detail page.
 *
 * @param citySlug - URL slug for the city segment (e.g. `"arles"`)
 * @param slug - URL slug for the tour segment (e.g. `"hello-arles-private-walk-9751538"`)
 * @returns Absolute tour page URL under `/tours/{citySlug}/{slug}`
 */
export function tourPageUrl(citySlug: string, slug: string): string {
  const city = citySlug.trim();
  const tourSlug = slug.trim();
  return absoluteUrl(`/tours/${city}/${tourSlug}`);
}
