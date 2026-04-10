"use server";

import { client } from "@/sanity/lib/client";
import {
  DEFAULT_REVIEW_LIMIT,
  type SanityReviewListItem,
} from "@/types/review";
import {
  reviewRatingSummaryFromAggregates,
  type ReviewRatingSummary,
} from "@/lib/utils/review-summary";

const REVIEW_FIELDS = `_id, tourId, rating, experienceDate, authorName, body`;

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

const DIGITS_ONLY_TOUR_ID = /^\d+$/;

function clampLimit(limit: number): number {
  const n = Math.floor(Number(limit));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_REVIEW_LIMIT;
  return Math.min(n, 50);
}

function isValidTourId(id: string): boolean {
  return DIGITS_ONLY_TOUR_ID.test(id.trim());
}

export type GetTourReviewsResult =
  | { ok: true; reviews: SanityReviewListItem[] }
  | { ok: false; error: Error };

/**
 * Published reviews for a single tour, newest experience first.
 * Fetch failures return `{ ok: false }` so callers can tell them apart from an empty result.
 */
export async function getTourReviews(
  tourId: string,
  limit: number = DEFAULT_REVIEW_LIMIT,
): Promise<GetTourReviewsResult> {
  const id = tourId.trim();
  if (!isValidTourId(id)) {
    return { ok: true, reviews: [] };
  }

  const lim = clampLimit(limit);
  try {
    const reviews = await client.fetch<SanityReviewListItem[]>(
      `*[_type == "review" && ${DRAFT_EXCLUDED} && tourId == $tourId] | order(experienceDate desc)[0...$lim] { ${REVIEW_FIELDS} }`,
      { tourId: id, lim },
    );
    return { ok: true, reviews };
  } catch (e) {
    console.error("[Reviews] getTourReviews failed", e);
    const error =
      e instanceof Error
        ? e
        : new Error(typeof e === "string" ? e : "Failed to load tour reviews");
    return { ok: false, error };
  }
}

/**
 * Published reviews for other tours (exclude current tour id), newest experience first.
 */
export async function getFallbackReviews(
  excludeTourId: string,
  limit: number = DEFAULT_REVIEW_LIMIT,
): Promise<SanityReviewListItem[]> {
  const id = excludeTourId.trim();
  if (!isValidTourId(id)) return [];

  const lim = clampLimit(limit);
  try {
    return await client.fetch<SanityReviewListItem[]>(
      `*[_type == "review" && ${DRAFT_EXCLUDED} && tourId != $excludeTourId] | order(experienceDate desc)[0...$lim] { ${REVIEW_FIELDS} }`,
      { excludeTourId: id, lim },
    );
  } catch (e) {
    console.error("[Reviews] getFallbackReviews failed", e);
    return [];
  }
}

/**
 * Published reviews across all tours, newest experience first.
 */
export async function getRecentReviews(
  limit: number = DEFAULT_REVIEW_LIMIT,
): Promise<SanityReviewListItem[]> {
  const lim = clampLimit(limit);
  try {
    return await client.fetch<SanityReviewListItem[]>(
      `*[_type == "review" && ${DRAFT_EXCLUDED}] | order(experienceDate desc)[0...$lim] { ${REVIEW_FIELDS} }`,
      { lim },
    );
  } catch (e) {
    console.error("[Reviews] getRecentReviews failed", e);
    return [];
  }
}

/** GROQ: round + clamp to 0–5 (matches {@link review-summary} `normalizeRating`). */
const GROQ_CLAMP_STAR =
  "select(round(rating) > 5 => 5, round(rating) < 0 => 0, true => round(rating))";

type ReviewRatingBucketRow = {
  total: number;
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
};

function groqReviewRatingBuckets(filterExtra: string): string {
  const base = `*[_type == "review" && ${DRAFT_EXCLUDED}${filterExtra}]`;
  const withCond = (cond: string) =>
    `*[_type == "review" && ${DRAFT_EXCLUDED}${filterExtra}${cond}]`;
  return `{
    "total": count(${base}),
    "c5": count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 5`)}),
    "c4": count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 4`)}),
    "c3": count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 3`)}),
    "c2": count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 2`)}),
    "c1": count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 1`)}),
    "c0": count(${withCond(` && !defined(rating)`)}) + count(${withCond(` && defined(rating) && ${GROQ_CLAMP_STAR} == 0`)})
  }`;
}

/**
 * Aggregated rating summary for one tour (no per-row fetch).
 */
export async function getReviewRatingsForTour(
  tourId: string,
): Promise<ReviewRatingSummary | null> {
  const id = tourId.trim();
  if (!isValidTourId(id)) return null;

  try {
    const row = await client.fetch<ReviewRatingBucketRow>(
      groqReviewRatingBuckets(" && tourId == $tourId"),
      { tourId: id },
    );
    return reviewRatingSummaryFromAggregates(row);
  } catch (e) {
    console.error("[Reviews] getReviewRatingsForTour failed", e);
    return null;
  }
}

/**
 * Aggregated rating summary site-wide (no per-row fetch).
 */
export async function getAllReviewRatings(): Promise<ReviewRatingSummary | null> {
  try {
    const row = await client.fetch<ReviewRatingBucketRow>(
      groqReviewRatingBuckets(""),
    );
    return reviewRatingSummaryFromAggregates(row);
  } catch (e) {
    console.error("[Reviews] getAllReviewRatings failed", e);
    return null;
  }
}
