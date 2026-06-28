/**
 * tour-page-metadata — resolve Next.js metadata for tour detail pages.
 *
 * Uses Sanity Tour SEO overrides when present; otherwise returns `{}` so
 * `app/layout.tsx` defaults apply unchanged.
 */

import type { Metadata } from "next";
import { getTourSeoMetadata } from "@/lib/tour-seo";
import type { TourSeoMetadata } from "@/types/tour-seo";

/**
 * Extracts the numeric Bokun product id from a tour URL slug suffix.
 *
 * @param slug - URL slug segment (e.g. `hello-toledo-private-walk-1077682`)
 * @returns Digits-only product id, or `null` when the slug has no numeric suffix
 */
export function extractTourIdFromSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("-").filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? last : null;
}

/**
 * Maps published Sanity Tour SEO fields to Next.js `Metadata`.
 *
 * Only non-empty `seoTitle` / `metaDescription` values are included so partial
 * editorial input and layout defaults can coexist.
 *
 * @param seo - Published Tour SEO document fields, or `null` when none exists
 */
export function buildTourPageMetadata(
  seo: TourSeoMetadata | null,
): Metadata {
  if (!seo) return {};

  const metadata: Metadata = {};
  const title = seo.seoTitle?.trim();
  const description = seo.metaDescription?.trim();

  if (title) metadata.title = title;
  if (description) metadata.description = description;

  return metadata;
}

/**
 * Resolves tour page metadata from the route slug via Sanity Tour SEO overrides.
 *
 * Does not call Bokun — keeps `generateMetadata` fast and decoupled from tour API availability.
 *
 * @param slug - Tour URL slug segment from route params
 */
export async function resolveTourPageMetadata(
  slug: string,
): Promise<Metadata> {
  const tourId = extractTourIdFromSlug(slug);
  if (!tourId) return {};

  const seo = await getTourSeoMetadata(tourId);
  return buildTourPageMetadata(seo);
}
