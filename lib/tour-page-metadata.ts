/**
 * tour-page-metadata — resolve Next.js metadata for tour detail pages.
 *
 * Merges published Sanity Tour SEO overrides with city-templated code fallbacks
 * derived from Bokun tour detail. When neither source yields values, returns `{}`
 * so `app/layout.tsx` defaults apply unchanged.
 */

import type { Metadata } from "next";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { pickBokunOgImageUrl } from "@/lib/bokun/pick-bokun-photo-url";
import {
  buildTourSeoFallbacks,
  type TourSeoFallbacks,
} from "@/lib/tour-seo-fallbacks";
import { getTourSeoMetadata } from "@/lib/tour-seo";
import { tourPageUrl } from "@/lib/site";
import { slugifyForUrl } from "@/lib/utils";
import type { TourSeoMetadata } from "@/types/tour-seo";

/** Optional URL context for canonical, Open Graph, and Twitter metadata. */
export type TourPageMetadataContext = {
  canonicalUrl: string;
  ogImageUrl: string | null;
};

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
 * When {@link TourPageMetadataContext} is provided, adds canonical URL, Open Graph,
 * and Twitter card tags (OG image uses Bókun `large` derived size when available).
 *
 * @param seo - Merged Sanity + fallback fields
 * @param context - Optional canonical URL and OG image for social metadata
 */
export function buildTourPageMetadata(
  seo: TourSeoMetadata | null,
  context?: TourPageMetadataContext,
): Metadata {
  if (!seo) return {};

  const metadata: Metadata = {};
  const title = seo.seoTitle?.trim();
  const description = seo.metaDescription?.trim();
  const focusKeyword = seo.focusKeyword?.trim();

  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (focusKeyword) metadata.keywords = focusKeyword;

  if (!context) return metadata;

  const { canonicalUrl, ogImageUrl } = context;

  metadata.alternates = { canonical: canonicalUrl };

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title: title || undefined,
    description: description || undefined,
    url: canonicalUrl,
    type: "website",
    siteName: "LocalCityWalks",
  };

  if (ogImageUrl) {
    openGraph.images = [
      {
        url: ogImageUrl,
        alt: title ?? "LocalCityWalks tour",
      },
    ];
  }

  metadata.openGraph = openGraph;

  const twitter: NonNullable<Metadata["twitter"]> = {
    card: "summary_large_image",
    title: title || undefined,
    description: description || undefined,
  };

  if (ogImageUrl) {
    twitter.images = [ogImageUrl];
  }

  metadata.twitter = twitter;

  return metadata;
}

/**
 * Resolves canonical city slug from Bokun `googlePlace.city` or route param.
 */
export function resolveTourCitySlug(
  routeCity: string,
  bokunCity?: string | null,
): string {
  const gpCity = bokunCity?.trim();
  return gpCity ? slugifyForUrl(gpCity) : slugifyForUrl(routeCity);
}

/**
 * Resolves tour page metadata from route params via Sanity overrides and Bokun fallbacks.
 *
 * Fetches Sanity and Bokun in parallel. When Bokun is unavailable, returns Sanity-only
 * metadata if overrides exist; otherwise `{}`. When Bokun succeeds, includes per-tour
 * canonical URL and Open Graph image from `keyPhoto.derived` (`large` preferred).
 *
 * @param routeCity - City segment from route params (e.g. `"toledo"`)
 * @param tourSlug - Tour slug segment from route params
 */
export async function resolveTourPageMetadata(
  routeCity: string,
  tourSlug: string,
): Promise<Metadata> {
  const tourId = extractTourIdFromSlug(tourSlug);
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

  const citySlug = resolveTourCitySlug(routeCity, cityName);
  const canonicalSlug = `${slugifyForUrl(tourDetail.data.title)}-${tourId}`;
  const canonicalUrl = tourPageUrl(citySlug, canonicalSlug);
  const ogImageUrl = pickBokunOgImageUrl(tourDetail.data.keyPhoto);

  return buildTourPageMetadata(merged, { canonicalUrl, ogImageUrl });
}
