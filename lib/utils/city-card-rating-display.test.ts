import { describe, expect, it } from "vitest";
import { resolveCityCardRatingDisplay } from "@/lib/utils/city-card-rating-display";
import type { ReviewRatingSummary } from "@/lib/utils/review-summary";

const summary = (
  totalCount: number,
  meanDisplayStars: number,
): ReviewRatingSummary => ({
  totalCount,
  meanDisplayStars,
  distribution: [],
});

describe("resolveCityCardRatingDisplay", () => {
  it("uses the per-tour mean when the tour has reviews", () => {
    expect(
      resolveCityCardRatingDisplay(summary(12, 4.7), summary(100, 4.6)),
    ).toEqual({
      ratingLabel: "4.7",
      showRating: true,
    });
  });

  it("falls back to the global mean when the tour has no reviews", () => {
    expect(
      resolveCityCardRatingDisplay(summary(0, 0), summary(100, 4.6)),
    ).toEqual({
      ratingLabel: "4.6",
      showRating: true,
    });
  });

  it("hides the rating row when no summary is available", () => {
    expect(resolveCityCardRatingDisplay(summary(0, 0), null)).toEqual({
      showRating: false,
    });
  });
});
