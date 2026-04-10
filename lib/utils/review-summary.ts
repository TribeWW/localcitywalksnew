import type { SanityReviewListItem } from "@/types/review";

export type StarDistributionRow = {
  label: string;
  stars: number;
  count: number;
};

/** Any row with a numeric `rating` (full review list or rating-only projection). */
export type ReviewRatingRow = Pick<SanityReviewListItem, "rating">;

/** Matches `ReviewCard` clamp: round, non-finite → 0, clamp 0–5. */
function normalizeRating(rating: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n)) as 0 | 1 | 2 | 3 | 4 | 5;
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
 * Counts per star level for histogram rows (5 → 0), aligned with ReviewCard rendering.
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
  return ([5, 4, 3, 2, 1, 0] as const).map((stars) => ({
    label: stars === 1 ? "1 star" : `${stars} stars`,
    stars,
    count: buckets[stars],
  }));
}
