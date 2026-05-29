import { beforeEach, describe, expect, it, vi } from "vitest";

const enrichMock = vi.fn();

vi.mock("@/lib/city-cards/enrich-city-cards-for-listing", () => ({
  enrichCityCardsForListing: (...args: unknown[]) => enrichMock(...args),
}));

import { enrichCityCardsForListingAction } from "@/lib/actions/city-card-listing.actions";

const baseCard = {
  id: "101",
  title: "Barcelona",
  image: "/preview.jpg",
};

describe("enrichCityCardsForListingAction", () => {
  beforeEach(() => {
    enrichMock.mockReset();
  });

  it("delegates to the listing enricher", async () => {
    enrichMock.mockResolvedValue([
      {
        ...baseCard,
        displayPricePerPerson: 124,
        displayPriceCurrency: "EUR",
        ratingLabel: "4.7",
        showRating: true,
      },
    ]);

    const result = await enrichCityCardsForListingAction([baseCard]);

    expect(enrichMock).toHaveBeenCalledWith([baseCard]);
    expect(result[0]?.ratingLabel).toBe("4.7");
  });
});
