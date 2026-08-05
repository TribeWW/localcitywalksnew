/**
 * enrichCityCardsForListing — short-circuits Bokun price-list when cards are
 * already warm with displayPricePerPerson (Redis snapshot path).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CityCardData, ProductPriceHeadline } from "@/types/bokun";

const enrichPricesMock = vi.fn();
const ratingsMock = vi.fn();
const prepareMock = vi.fn();

vi.mock("@/lib/bokun/enrich-product-prices-from-price-list", () => ({
  collectDefaultRateIdsFromCards: (cards: CityCardData[]) => {
    const map = new Map<string, number>();
    for (const card of cards) {
      if (card.defaultRateId != null) {
        map.set(String(card.id), card.defaultRateId);
      }
    }
    return map;
  },
  enrichProductPricesFromPriceList: (...args: unknown[]) =>
    enrichPricesMock(...args),
}));

vi.mock("@/lib/actions/reviews.actions", () => ({
  getReviewRatingSummariesForTourIds: (...args: unknown[]) =>
    ratingsMock(...args),
}));

vi.mock("@/lib/city-cards/prepare-city-cards-for-display", () => ({
  prepareCityCardsForListingDisplay: (...args: unknown[]) =>
    prepareMock(...args),
}));

import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";

const baseCard: CityCardData = {
  id: "1",
  title: "Porto Walk",
  image: "/porto.jpg",
};

const pricedCard: CityCardData = {
  ...baseCard,
  id: "2",
  title: "Lisbon Walk",
  displayPricePerPerson: 62,
  displayPriceCurrency: "EUR",
  defaultRateId: 100,
};

describe("enrichCityCardsForListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ratingsMock.mockResolvedValue({
      perTourMap: new Map(),
      globalSummary: null,
    });
    prepareMock.mockImplementation(
      (cards: CityCardData[]) => cards as CityCardData[],
    );
    enrichPricesMock.mockResolvedValue(new Map());
  });

  it("returns [] without calling Bokun or Sanity for an empty input", async () => {
    await expect(enrichCityCardsForListing([])).resolves.toEqual([]);
    expect(enrichPricesMock).not.toHaveBeenCalled();
    expect(ratingsMock).not.toHaveBeenCalled();
  });

  it("skips Bokun price enrichment when all cards already have display prices", async () => {
    const cards = [pricedCard];

    await enrichCityCardsForListing(cards);

    expect(enrichPricesMock).not.toHaveBeenCalled();
    expect(ratingsMock).toHaveBeenCalledWith(["2"]);
    expect(prepareMock).toHaveBeenCalledWith(
      cards,
      expect.any(Map),
      expect.anything(),
    );
    const headlines = prepareMock.mock.calls[0][1] as Map<
      string,
      ProductPriceHeadline
    >;
    expect(headlines.size).toBe(0);
  });

  it("calls Bokun only for cards missing displayPricePerPerson", async () => {
    const unpriced: CityCardData = {
      ...baseCard,
      defaultRateId: 50,
    };
    const headline: ProductPriceHeadline = { amount: 40, currency: "EUR" };
    enrichPricesMock.mockResolvedValue(new Map([["1", headline]]));

    await enrichCityCardsForListing([unpriced, pricedCard]);

    expect(enrichPricesMock).toHaveBeenCalledTimes(1);
    expect(enrichPricesMock).toHaveBeenCalledWith(
      ["1"],
      expect.any(Map),
    );
    expect(ratingsMock).toHaveBeenCalledWith(["1", "2"]);
  });

  it("still enriches when cards lack display prices", async () => {
    const unpriced: CityCardData = { ...baseCard, defaultRateId: 50 };
    enrichPricesMock.mockResolvedValue(
      new Map([["1", { amount: 40, currency: "EUR" }]]),
    );

    await enrichCityCardsForListing([unpriced]);

    expect(enrichPricesMock).toHaveBeenCalledWith(["1"], expect.any(Map));
    expect(ratingsMock).toHaveBeenCalledWith(["1"]);
  });
});
