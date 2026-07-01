/**
 * tour-page-metadata — resolve Next.js metadata for tour detail pages.
 *
 * Merges published Sanity Tour SEO overrides with city-templated code fallbacks
 * derived from Bokun tour detail. When neither source yields values, returns `{}`
 * so `app/layout.tsx` defaults apply unchanged.
 */

import type { Metadata } from "next";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { buildTourSeoFallbacks, type TourSeoFallbacks } from "@/lib/tour-seo-fallbacks";
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
 * Returns whether a resolved SEO field has a non-blank value.
 *
 * @param value - Candidate string from Sanity or code fallbacks
 */
function hasNonBlankSeoValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Returns whether Sanity provides at least one usable SEO override field.
 *
 * @param seo - Published Tour SEO document fields, or null when none exists
 */
function hasSanitySeoOverrides(seo: TourSeoMetadata | null): boolean {
  if (!seo) return false;
  return (
    hasNonBlankSeoValue(seo.seoTitle) ||
    hasNonBlankSeoValue(seo.metaDescription) ||
    hasNonBlankSeoValue(seo.focusKeyword)
  );
}

/**
 * Merges Sanity Tour SEO overrides with code fallbacks on a per-field basis.
 *
 * Non-empty Sanity values win; empty or missing Sanity fields use fallbacks.
 *
 * @param sanity - Published Tour SEO fields from Sanity, or null when no document exists
 * @param fallbacks - City-templated defaults from {@link buildTourSeoFallbacks}
 */
export function mergeTourSeoFields(
  sanity: TourSeoMetadata | null,
  fallbacks: TourSeoFallbacks,
): TourSeoMetadata {
  const pick = (
    override: string | null | undefined,
    fallback: string,
  ): string => {
    const trimmed = override?.trim();
    return trimmed ? trimmed : fallback;
  };

  return {
    seoTitle: pick(sanity?.seoTitle, fallbacks.seoTitle),
    metaDescription: pick(sanity?.metaDescription, fallbacks.metaDescription),
    focusKeyword: pick(sanity?.focusKeyword, fallbacks.focusKeyword),
  };
}

/**
 * Maps resolved Tour SEO fields to Next.js `Metadata`.
 *
 * Only non-empty values are included so partial output and layout defaults can coexist.
 *
 * @param seo - Merged Sanity + fallback fields
 */
export function buildTourPageMetadata(
  seo: TourSeoMetadata | null,
): Metadata {
  if (!seo) return {};

  const metadata: Metadata = {};
  const title = seo.seoTitle?.trim();
  const description = seo.metaDescription?.trim();
  const focusKeyword = seo.focusKeyword?.trim();

  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (focusKeyword) metadata.keywords = focusKeyword;

  return metadata;
}

/**
 * Resolves tour page metadata from the route slug via Sanity overrides and Bokun fallbacks.
 *
 * Fetches Sanity and Bokun in parallel. When Bokun is unavailable, returns Sanity-only
 * metadata if overrides exist; otherwise `{}`.
 *
 * @param slug - Tour URL slug segment from route params
 */
export async function resolveTourPageMetadata(
  slug: string,
): Promise<Metadata> {
  const tourId = extractTourIdFromSlug(slug);
  if (!tourId) return {};

  const [sanitySeo, tourDetail] = await Promise.all([
    getTourSeoMetadata(tourId),
    getTourDetailById(tourId),
  ]);

  if (!tourDetail.success || !tourDetail.data) {
    if (!hasSanitySeoOverrides(sanitySeo)) return {};
    return buildTourPageMetadata(sanitySeo);
  }

  const cityName = tourDetail.data.googlePlace?.city;
  const fallbacks = buildTourSeoFallbacks(cityName);
  const merged = mergeTourSeoFields(sanitySeo, fallbacks);

  return buildTourPageMetadata(merged);
}
