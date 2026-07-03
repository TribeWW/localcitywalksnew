/**
 * JSON-LD builders for tour detail pages (TouristTrip, AggregateRating, Review).
 */

import { SITE_URL, tourPageUrl } from "@/lib/site";
import type { SanityReviewListItem } from "@/types/review";

const SCHEMA_CONTEXT = "https://schema.org";
const IN_STOCK = `${SCHEMA_CONTEXT}/InStock`;

/** Hero review stats shown on the tour page (mirrors UI). */
export type TourHeroReviewStats = {
  ratingLabel: string;
  reviewCount: number;
};

/** Input for {@link buildTourPageJsonLd}. */
export type BuildTourPageJsonLdInput = {
  title: string;
  excerpt?: string | null;
  htmlDescription?: string | null;
  url: string;
  imageUrl: string | null;
  cityName?: string | null;
  durationText?: string | null;
  fromPriceAmount?: number;
  fromPriceCurrency?: string;
  heroReviewStats?: TourHeroReviewStats | null;
  reviews?: SanityReviewListItem[];
};

type PlainTextInput = {
  excerpt?: string | null;
  htmlDescription?: string | null;
};

/**
 * Resolves plain-text description for schema.org (no HTML).
 *
 * Prefers `excerpt`; otherwise strips tags from `htmlDescription`.
 */
export function plainTextForSchema(input: PlainTextInput): string {
  const excerpt = input.excerpt?.trim();
  if (excerpt) return excerpt;

  const html = input.htmlDescription?.trim();
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converts Bókun `durationText` (e.g. `"2 hours"`) to ISO 8601 duration.
 *
 * @returns ISO 8601 duration string (e.g. `PT2H`), or `undefined` when not parseable.
 */
export function durationTextToIso8601(durationText: string): string | undefined {
  const trimmed = durationText.trim();
  const match = /^(\d+)\s*hours?$/i.exec(trimmed);
  if (!match) return undefined;
  const hours = Number(match[1]);
  if (!Number.isFinite(hours) || hours <= 0) return undefined;
  return `PT${hours}H`;
}

/** Clamps review rating to 0–5 integer stars (aligned with ReviewCard). */
function normalizeReviewRating(rating: number): number {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

/**
 * Builds a schema.org `AggregateRating` object.
 */
export function buildAggregateRatingJsonLd(
  ratingLabel: string,
  reviewCount: number,
): Record<string, string> {
  return {
    "@type": "AggregateRating",
    ratingValue: ratingLabel,
    reviewCount: String(reviewCount),
    bestRating: "5",
    worstRating: "1",
  };
}

/**
 * Builds a schema.org `Review` object from a Sanity review row.
 */
export function buildReviewJsonLd(
  review: SanityReviewListItem,
): Record<string, unknown> {
  const stars = normalizeReviewRating(review.rating);
  const entry: Record<string, unknown> = {
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.authorName,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(stars),
      bestRating: "5",
      worstRating: "1",
    },
    datePublished: review.experienceDate,
  };

  const body = review.body?.trim();
  if (body) {
    entry.reviewBody = body;
  }

  return entry;
}

/**
 * Builds a complete `TouristTrip` JSON-LD document for a tour detail page.
 *
 * Optionally nests `aggregateRating` and `review` when review data is visible
 * on the page. Omit `heroReviewStats` / `reviews` when no reviews are shown.
 */
export function buildTourPageJsonLd(
  input: BuildTourPageJsonLdInput,
): Record<string, unknown> {
  const description = plainTextForSchema({
    excerpt: input.excerpt,
    htmlDescription: input.htmlDescription,
  });

  const trip: Record<string, unknown> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "TouristTrip",
    name: input.title,
    description,
    url: input.url,
    touristType: "Sightseeing",
    provider: {
      "@type": "Organization",
      name: "LocalCityWalks",
      url: SITE_URL,
    },
  };

  if (input.imageUrl) {
    trip.image = input.imageUrl;
  }

  const cityName = input.cityName?.trim();
  if (cityName) {
    trip.itinerary = {
      "@type": "City",
      name: cityName,
    };
  }

  const duration = input.durationText
    ? durationTextToIso8601(input.durationText)
    : undefined;
  if (duration) {
    trip.duration = duration;
  }

  if (
    input.fromPriceAmount != null &&
    input.fromPriceCurrency?.trim()
  ) {
    trip.offers = {
      "@type": "Offer",
      price: String(input.fromPriceAmount),
      priceCurrency: input.fromPriceCurrency.trim(),
      availability: IN_STOCK,
      url: input.url,
    };
  }

  const stats = input.heroReviewStats;
  if (stats && stats.reviewCount > 0) {
    trip.aggregateRating = buildAggregateRatingJsonLd(
      stats.ratingLabel,
      stats.reviewCount,
    );
  }

  const reviews = input.reviews ?? [];
  if (reviews.length > 0) {
    trip.review = reviews.map(buildReviewJsonLd);
  }

  return trip;
}

/** Re-export for callers building explore-style lists from tour cards. */
export { tourPageUrl };
