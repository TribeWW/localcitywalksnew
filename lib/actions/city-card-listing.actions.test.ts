import { beforeEach, describe, expect, it, vi } from "vitest";

const enrichMock = vi.fn();

vi.mock("@/lib/city-cards/enrich-city-cards-for-listing", () => ({
  enrichCityCardsForListing: (...args: unknown[]) => enrichMock(...args),
}));

import { enrichCityCardsForListingAction } from "@/lib/actions/city-card-listing.actions";
import type { CityCardData } from "@/types/bokun";

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

  it("rejects when given no cards", async () => {
    await expect(enrichCityCardsForListingAction([])).rejects.toThrow(
      "empty array",
    );
    expect(enrichMock).not.toHaveBeenCalled();
  });

  it("rejects non-array input without calling the enricher", async () => {
    await expect(
      enrichCityCardsForListingAction(null as unknown as CityCardData[]),
    ).rejects.toThrow("expected an array");
    expect(enrichMock).not.toHaveBeenCalled();
  });

  it("rejects oversized batches without calling the enricher", async () => {
    const cards = Array.from({ length: 101 }, (_, index) => ({
      ...baseCard,
      id: String(index + 1),
    }));

    await expect(enrichCityCardsForListingAction(cards)).rejects.toThrow(
      "at most 100 cards",
    );
    expect(enrichMock).not.toHaveBeenCalled();
  });

  it("rejects malformed cards without calling the enricher", async () => {
    await expect(
      enrichCityCardsForListingAction([
        { ...baseCard, title: "" },
      ] as CityCardData[]),
    ).rejects.toThrow("title at index 0");
    expect(enrichMock).not.toHaveBeenCalled();
  });

  it("propagates enrichment errors", async () => {
    enrichMock.mockRejectedValue(new Error("Enrichment failed"));

    await expect(enrichCityCardsForListingAction([baseCard])).rejects.toThrow(
      "Enrichment failed",
    );
  });
});
