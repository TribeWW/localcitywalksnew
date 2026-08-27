/**
 * get-related-tours — unit tests for the related-tours orchestrator.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getExploreCatalogForStructuredDataMock = vi.fn();
const getHomeSpotlightProductIdsMock = vi.fn();
const getRelatedTourRegionCitiesMock = vi.fn();
const enrichCityCardsForListingMock = vi.fn();

vi.mock("@/lib/explore/catalog", () => ({
  getExploreCatalogForStructuredData: (...args: unknown[]) =>
    getExploreCatalogForStructuredDataMock(...args),
}));

vi.mock("@/lib/home/spotlight", () => ({
  getHomeSpotlightProductIds: (...args: unknown[]) =>
    getHomeSpotlightProductIdsMock(...args),
}));

vi.mock("@/lib/tours/related-tours/region-cities", () => ({
  getRelatedTourRegionCities: (...args: unknown[]) =>
    getRelatedTourRegionCitiesMock(...args),
}));

vi.mock("@/lib/city-cards/enrich-city-cards-for-listing", () => ({
  enrichCityCardsForListing: (...args: unknown[]) =>
    enrichCityCardsForListingMock(...args),
}));

import { getRelatedTours } from "@/lib/tours/related-tours/get-related-tours";
import type { CityCardData } from "@/types/bokun";

function card(
  partial: Pick<CityCardData, "id" | "title"> &
    Partial<Omit<CityCardData, "id" | "title">>,
): CityCardData {
  return {
    image: "/img.jpg",
    ...partial,
  };
}

const CATALOG: CityCardData[] = [
  card({
    id: "1",
    title: "Aix Walk",
    citySlug: "aix-en-provence",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "2",
    title: "Arles Walk",
    citySlug: "arles",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "3",
    title: "Avignon Old Town",
    citySlug: "avignon",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "4",
    title: "Avignon Story",
    citySlug: "avignon",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "5",
    title: "Bordeaux Walk",
    citySlug: "bordeaux",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "20",
    title: "Spotlight Extra A",
    citySlug: "rome",
    countryCode: "IT",
    country: "Italy",
  }),
];

const BASE_INPUT = {
  productId: "3",
  citySlug: "avignon",
  cityCode: "AVIGNON",
  countryCode: "FR",
  countryName: "France",
  cardsWidgetUpdate: false,
};

describe("getRelatedTours", () => {
  beforeEach(() => {
    getExploreCatalogForStructuredDataMock.mockReset();
    getHomeSpotlightProductIdsMock.mockReset();
    getRelatedTourRegionCitiesMock.mockReset();
    enrichCityCardsForListingMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});

    getExploreCatalogForStructuredDataMock.mockResolvedValue({
      success: true,
      items: CATALOG,
    });
    getHomeSpotlightProductIdsMock.mockResolvedValue(["20"]);
    getRelatedTourRegionCitiesMock.mockResolvedValue({
      hasRegion: true,
      regionCitySlugs: ["aix-en-provence", "arles", "avignon"],
      regionName: "Provence",
    });
  });

  it("loads catalog, spotlight ids, and region in parallel then selects related cards", async () => {
    const result = await getRelatedTours(BASE_INPUT);

    expect(getExploreCatalogForStructuredDataMock).toHaveBeenCalledTimes(1);
    expect(getHomeSpotlightProductIdsMock).toHaveBeenCalledTimes(1);
    expect(getRelatedTourRegionCitiesMock).toHaveBeenCalledWith({
      citySlug: "avignon",
      cityCode: "AVIGNON",
    });
    expect(enrichCityCardsForListingMock).not.toHaveBeenCalled();

    expect(result).not.toBeNull();
    expect(result!.heading).toBe("Explore Provence and more of France");
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
  });

  it("treats null spotlight ids as an empty list", async () => {
    getHomeSpotlightProductIdsMock.mockResolvedValue(null);
    getRelatedTourRegionCitiesMock.mockResolvedValue({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });
    getExploreCatalogForStructuredDataMock.mockResolvedValue({
      success: true,
      items: [
        card({
          id: "3",
          title: "Lonely",
          citySlug: "lonely",
          countryCode: "XX",
        }),
        card({
          id: "20",
          title: "Spotlight Extra A",
          citySlug: "rome",
          countryCode: "IT",
        }),
      ],
    });

    const result = await getRelatedTours({
      ...BASE_INPUT,
      citySlug: "lonely",
      cityCode: "LONELY",
      countryCode: "XX",
      countryName: "Nowhere",
    });

    // No same-country peers; null spotlight → no tier-4 fills → only null section if 0.
    // Current is lonely with no peers → null.
    expect(result).toBeNull();
  });

  it("enriches selected cards when cardsWidgetUpdate is true", async () => {
    const enriched = [
      card({
        id: "4",
        title: "Avignon Story",
        citySlug: "avignon",
        countryCode: "FR",
        displayPricePerPerson: 99,
      }),
      card({
        id: "1",
        title: "Aix Walk",
        citySlug: "aix-en-provence",
        countryCode: "FR",
        displayPricePerPerson: 80,
      }),
      card({
        id: "2",
        title: "Arles Walk",
        citySlug: "arles",
        countryCode: "FR",
        displayPricePerPerson: 70,
      }),
      card({
        id: "5",
        title: "Bordeaux Walk",
        citySlug: "bordeaux",
        countryCode: "FR",
        displayPricePerPerson: 60,
      }),
    ];
    enrichCityCardsForListingMock.mockResolvedValue(enriched);

    const result = await getRelatedTours({
      ...BASE_INPUT,
      cardsWidgetUpdate: true,
    });

    expect(enrichCityCardsForListingMock).toHaveBeenCalledTimes(1);
    expect(enrichCityCardsForListingMock.mock.calls[0][0]).toHaveLength(4);
    expect(result!.cards).toEqual(enriched);
  });

  it("keeps unenriched cards and logs when enrichment throws", async () => {
    enrichCityCardsForListingMock.mockRejectedValue(new Error("enrich down"));

    const result = await getRelatedTours({
      ...BASE_INPUT,
      cardsWidgetUpdate: true,
    });

    expect(result).not.toBeNull();
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
    expect(result!.cards[0].displayPricePerPerson).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[Related tours]"),
      expect.any(Error),
    );
  });

  it("returns null and logs when the catalog snapshot fails", async () => {
    getExploreCatalogForStructuredDataMock.mockResolvedValue({
      success: false,
      error: "cache miss rebuild failed",
    });

    await expect(getRelatedTours(BASE_INPUT)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[Related tours]"),
      expect.anything(),
    );
    expect(enrichCityCardsForListingMock).not.toHaveBeenCalled();
  });

  it("returns null and logs when the catalog loader throws", async () => {
    getExploreCatalogForStructuredDataMock.mockRejectedValue(
      new Error("catalog boom"),
    );

    await expect(getRelatedTours(BASE_INPUT)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[Related tours]"),
      expect.any(Error),
    );
  });

  it("returns null when selection yields zero cards", async () => {
    getExploreCatalogForStructuredDataMock.mockResolvedValue({
      success: true,
      items: [
        card({
          id: "3",
          title: "Only Tour",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
    });
    getHomeSpotlightProductIdsMock.mockResolvedValue([]);
    getRelatedTourRegionCitiesMock.mockResolvedValue({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });

    await expect(getRelatedTours(BASE_INPUT)).resolves.toBeNull();
  });

  it("does not enrich when the flag is on but selection is empty", async () => {
    getExploreCatalogForStructuredDataMock.mockResolvedValue({
      success: true,
      items: [
        card({
          id: "3",
          title: "Only Tour",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
    });
    getHomeSpotlightProductIdsMock.mockResolvedValue([]);
    getRelatedTourRegionCitiesMock.mockResolvedValue({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });

    await expect(
      getRelatedTours({ ...BASE_INPUT, cardsWidgetUpdate: true }),
    ).resolves.toBeNull();
    expect(enrichCityCardsForListingMock).not.toHaveBeenCalled();
  });
});
