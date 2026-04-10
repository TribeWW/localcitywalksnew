"use server";

import { client } from "@/sanity/lib/client";
import {
  DEFAULT_REVIEW_LIMIT,
  type SanityReviewListItem,
} from "@/types/review";

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

/**
 * Published reviews for a single tour, newest experience first.
 */
export async function getTourReviews(
  tourId: string,
  limit: number = DEFAULT_REVIEW_LIMIT,
): Promise<SanityReviewListItem[]> {
  const id = tourId.trim();
  if (!isValidTourId(id)) return [];

  const lim = clampLimit(limit);
  try {
    return await client.fetch<SanityReviewListItem[]>(
      `*[_type == "review" && ${DRAFT_EXCLUDED} && tourId == $tourId] | order(experienceDate desc)[0...$lim] { ${REVIEW_FIELDS} }`,
      { tourId: id, lim },
    );
  } catch (e) {
    console.error("[Reviews] getTourReviews failed", e);
    return [];
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

/** All published ratings for one tour (summary / histogram only; no row limit). */
export async function getReviewRatingsForTour(
  tourId: string,
): Promise<Array<{ rating: number }>> {
  const id = tourId.trim();
  if (!isValidTourId(id)) return [];

  try {
    return await client.fetch<Array<{ rating: number }>>(
      `*[_type == "review" && ${DRAFT_EXCLUDED} && tourId == $tourId]{rating}`,
      { tourId: id },
    );
  } catch (e) {
    console.error("[Reviews] getReviewRatingsForTour failed", e);
    return [];
  }
}

/** All published ratings site-wide (summary when showing non–tour-specific cards). */
export async function getAllReviewRatings(): Promise<Array<{ rating: number }>> {
  try {
    return await client.fetch<Array<{ rating: number }>>(
      `*[_type == "review" && ${DRAFT_EXCLUDED}]{rating}`,
    );
  } catch (e) {
    console.error("[Reviews] getAllReviewRatings failed", e);
    return [];
  }
}
