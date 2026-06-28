/**
 * tour-seo — fetch published Tour SEO metadata from Sanity for tour detail pages.
 *
 * Plain module (not `"use server"`) safe for Server Components and `generateMetadata`.
 */

import { client } from "@/sanity/lib/client";
import type { TourSeoMetadata } from "@/types/tour-seo";

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/**
 * GROQ projection for the published Tour SEO document matching a Bokun product id.
 *
 * Excludes draft documents so only published editorial overrides are injected on the site.
 */
export const TOUR_SEO_QUERY = `*[_type == "tourSeoMetadata" && ${DRAFT_EXCLUDED} && tour.bokunProductId == $tourId][0]{
  seoTitle,
  metaDescription
}`;

const DIGITS_ONLY_TOUR_ID = /^\d+$/;

/**
 * Returns whether `tourId` is a non-empty Bokun product id (digits only).
 *
 * @param tourId - Trimmed candidate id from a tour URL slug suffix
 */
function isValidTourId(tourId: string): boolean {
  return DIGITS_ONLY_TOUR_ID.test(tourId);
}

/**
 * Loads published Tour SEO title/description overrides for a Bokun product.
 *
 * Invalid ids short-circuit to `null` without hitting Sanity. Fetch failures are logged
 * and also return `null` so tour pages keep working with layout defaults.
 *
 * @param tourId - Numeric Bokun product id (e.g. suffix from `/tours/{city}/{slug}-{id}`)
 * @returns Matching metadata fields, or `null` when id is invalid, doc is missing, or fetch fails
 */
export async function getTourSeoMetadata(
  tourId: string,
): Promise<TourSeoMetadata | null> {
  const id = tourId.trim();
  if (!isValidTourId(id)) {
    return null;
  }

  try {
    const doc = await client.fetch<TourSeoMetadata | null>(TOUR_SEO_QUERY, {
      tourId: id,
    });
    if (!doc) return null;
    return doc;
  } catch (e) {
    console.error("[Tour SEO] Sanity fetch failed", e);
    return null;
  }
}
