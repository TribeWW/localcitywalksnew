/**
 * Resolves a tour page href for checkout error recovery links (LOC-1154).
 */

import { slugifyForUrl } from "@/lib/utils";

const EXPLORE_HREF = "/explore";

/**
 * Builds `/tours/{city}/{slug}` from product metadata.
 *
 * Falls back to `/explore` when city or title is unavailable.
 *
 * @param productId - Bókun activity id
 * @param title - Product title for slug generation
 * @param cityName - Optional city from `googlePlace.city`
 */
export function resolveCheckoutTourPageHref(
  productId: string,
  title?: string,
  cityName?: string,
): string {
  const trimmedTitle = title?.trim();
  const trimmedCity = cityName?.trim();

  if (!trimmedTitle || !trimmedCity) {
    return EXPLORE_HREF;
  }

  const citySlug = slugifyForUrl(trimmedCity);
  const slug = `${slugifyForUrl(trimmedTitle)}-${productId}`;
  return `/tours/${citySlug}/${slug}`;
}
