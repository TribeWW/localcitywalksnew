import type { SanityReviewListItem } from "@/types/review";

export type StarDistributionRow = {
  label: string;
  stars: number;
  count: number;
};

/**
 * Mean star rating (1–5) for displayed reviews; 0 if empty.
 */
export function meanStarRating(reviews: SanityReviewListItem[]): number {
  if (reviews.length === 0) return 0;
  let sum = 0;
  for (const r of reviews) {
    const n = Math.round(Number(r.rating));
    const s = !Number.isFinite(n) ? 0 : Math.min(5, Math.max(1, n));
    sum += s;
  }
  return sum / reviews.length;
}

/**
 * Counts per star level for histogram rows (5 → 1), aligned with tour review mock UI.
 */
export function starDistribution(
  reviews: SanityReviewListItem[],
): StarDistributionRow[] {
  const buckets: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const r of reviews) {
    const n = Math.round(Number(r.rating));
    if (!Number.isFinite(n)) continue;
    const s = Math.min(5, Math.max(1, n)) as 1 | 2 | 3 | 4 | 5;
    buckets[s] += 1;
  }
  return [5, 4, 3, 2, 1].map((stars) => ({
    label: stars === 1 ? "1 star" : `${stars} stars`,
    stars,
    count: buckets[stars as keyof typeof buckets],
  }));
}
