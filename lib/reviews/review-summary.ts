import type { SanityReviewListItem } from "@/types/review";

export type StarDistributionRow = {
  label: string;
  stars: number;
  count: number;
};

/** Pre-aggregated summary for the tour / site-wide left column (from GROQ counts). */
export type ReviewRatingSummary = {
  totalCount: number;
  /** Mean of per-review displayed stars (0–5), same as `meanStarRating` over the full set. */
  meanDisplayStars: number;
  distribution: StarDistributionRow[];
};

/** Any row with a numeric `rating` (full review list or rating-only projection). */
export type ReviewRatingRow = Pick<SanityReviewListItem, "rating">;

/** Matches `ReviewCard` clamp: round, non-finite → 0, clamp 0–5. */
function normalizeRating(rating: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n)) as 0 | 1 | 2 | 3 | 4 | 5;
}

function distributionRowsFromBuckets(
  buckets: Record<0 | 1 | 2 | 3 | 4 | 5, number>,
): StarDistributionRow[] {
  // Omit 0 stars: not a user-facing rating on the site; c0 still rolls into totalCount elsewhere.
  return ([5, 4, 3, 2, 1] as const).map((stars) => ({
    label: stars === 1 ? "1 star" : `${stars} stars`,
    stars,
    count: buckets[stars],
  }));
}

/**
 * Build {@link ReviewRatingSummary} from GROQ bucket counts (aligned with {@link normalizeRating}).
 */
export function reviewRatingSummaryFromAggregates(row: {
  total: number;
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}): ReviewRatingSummary {
  const buckets: Record<0 | 1 | 2 | 3 | 4 | 5, number> = {
    0: row.c0,
    1: row.c1,
    2: row.c2,
    3: row.c3,
    4: row.c4,
    5: row.c5,
  };
  const totalCount = row.total;
  const meanDisplayStars =
    totalCount === 0
      ? 0
      : (row.c1 +
          2 * row.c2 +
          3 * row.c3 +
          4 * row.c4 +
          5 * row.c5) /
        totalCount;
  return {
    totalCount,
    meanDisplayStars,
    distribution: distributionRowsFromBuckets(buckets),
  };
}

/**
 * Mean of displayed star counts (0–5) per review; 0 if there are no reviews.
 */
export function meanStarRating(reviews: ReadonlyArray<ReviewRatingRow>): number {
  if (reviews.length === 0) return 0;
  let sum = 0;
  for (const r of reviews) {
    sum += normalizeRating(r.rating);
  }
  return sum / reviews.length;
}

/**
 * Counts per star level for histogram rows (5 → 1), aligned with ReviewCard rendering.
 */
export function starDistribution(
  reviews: ReadonlyArray<ReviewRatingRow>,
): StarDistributionRow[] {
  const buckets: Record<0 | 1 | 2 | 3 | 4 | 5, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const r of reviews) {
    const s = normalizeRating(r.rating);
    buckets[s] += 1;
  }
  return distributionRowsFromBuckets(buckets);
}
