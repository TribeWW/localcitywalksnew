import { describe, expect, it } from "vitest";
import { prepareCityCardsForListingDisplay } from "@/lib/city-cards/prepare-city-cards-for-display";
import type { CityCardData } from "@/types/bokun";
import type { ReviewRatingSummary } from "@/lib/utils/review-summary";

const baseCard: CityCardData = {
  id: "101",
  title: "Barcelona",
  image: "/preview.jpg",
};

const summary = (
  totalCount: number,
  meanDisplayStars: number,
): ReviewRatingSummary => ({
  totalCount,
  meanDisplayStars,
  distribution: [],
});

describe("prepareCityCardsForListingDisplay", () => {
  it("merges price headlines and rating display fields onto cards", () => {
    const prepared = prepareCityCardsForListingDisplay(
      [baseCard],
      new Map([["101", { amount: 124, currency: "EUR" }]]),
      {
        globalSummary: summary(10, 4.6),
        perTourMap: new Map([["101", summary(2, 4.5)]]),
      },
    );

    expect(prepared[0]).toEqual({
      ...baseCard,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
      ratingLabel: "4.5",
      showRating: true,
    });
  });
});
