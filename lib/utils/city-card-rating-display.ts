import type { ReviewRatingSummary } from "@/lib/utils/review-summary";

export type CityCardRatingDisplay = {
  ratingLabel?: string;
  showRating: boolean;
};

/**
 * Resolves listing-card rating copy from per-tour and global Sanity summaries.
 */
export function resolveCityCardRatingDisplay(
  perTourSummary: ReviewRatingSummary | null | undefined,
  globalSummary: ReviewRatingSummary | null | undefined,
): CityCardRatingDisplay {
  if (perTourSummary && perTourSummary.totalCount > 0) {
    return {
      ratingLabel: perTourSummary.meanDisplayStars.toFixed(1),
      showRating: true,
    };
  }

  if (globalSummary && globalSummary.totalCount > 0) {
    return {
      ratingLabel: globalSummary.meanDisplayStars.toFixed(1),
      showRating: true,
    };
  }

  return { showRating: false };
}
