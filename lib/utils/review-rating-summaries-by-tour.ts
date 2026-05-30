import {
  reviewRatingSummaryFromAggregates,
  type ReviewRatingSummary,
} from "@/lib/utils/review-summary";
import { normalizeBokunProductIds } from "@/lib/utils/bokun-product-id";

export const MAX_BULK_RATING_TOUR_IDS = 50;

type ReviewStarBucketRow = {
  total: number;
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
};

export type ReviewStarProjectionRow = {
  tourId: string;
  s: number;
};

function emptyReviewStarBuckets(): ReviewStarBucketRow {
  return { total: 0, c0: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
}

function clampProjectedStar(star: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.round(Number(star));
  if (!Number.isFinite(rounded)) {
    return 0;
  }
  return Math.min(5, Math.max(0, rounded)) as 0 | 1 | 2 | 3 | 4 | 5;
}

/**
 * Normalizes listing tour ids for bulk rating fetch: dedupe, digits-only, capped length.
 */
export function normalizeTourIdsForBulkRating(
  tourIds: readonly unknown[],
): string[] {
  return normalizeBokunProductIds(tourIds, MAX_BULK_RATING_TOUR_IDS);
}

/**
 * Aggregates clamped Sanity star projections into per-tour rating summaries.
 */
export function buildReviewRatingSummariesByTourId(
  requestedTourIds: readonly string[],
  rows: readonly ReviewStarProjectionRow[],
): Map<string, ReviewRatingSummary> {
  const bucketsByTourId = new Map<string, ReviewStarBucketRow>();

  for (const tourId of requestedTourIds) {
    bucketsByTourId.set(tourId, emptyReviewStarBuckets());
  }

  for (const row of rows) {
    const tourId = row.tourId?.trim();
    if (!tourId) {
      continue;
    }

    const buckets = bucketsByTourId.get(tourId);
    if (!buckets) {
      continue;
    }

    const star = clampProjectedStar(row.s);
    buckets.total += 1;
    if (star === 0) buckets.c0 += 1;
    if (star === 1) buckets.c1 += 1;
    if (star === 2) buckets.c2 += 1;
    if (star === 3) buckets.c3 += 1;
    if (star === 4) buckets.c4 += 1;
    if (star === 5) buckets.c5 += 1;
  }

  const summaries = new Map<string, ReviewRatingSummary>();
  for (const [tourId, buckets] of bucketsByTourId) {
    summaries.set(tourId, reviewRatingSummaryFromAggregates(buckets));
  }

  return summaries;
}
