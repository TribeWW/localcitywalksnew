/**
 * ExploreCatalog — unit tests for the SSR catalog + featured-countries wiring.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getExploreCatalogPageMock = vi.fn();
const getFeaturedExploreCountriesMock = vi.fn();
const getCountryFlagIconUrlsMock = vi.fn();
const cardsWidgetUpdateMock = vi.fn();
const enrichCityCardsForListingMock = vi.fn();

vi.mock("@/lib/explore/catalog", () => ({
  getExploreCatalogPage: (...args: unknown[]) =>
    getExploreCatalogPageMock(...args),
}));

vi.mock("@/lib/explore/featured-countries", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/explore/featured-countries")>();
  return {
    ...actual,
    getFeaturedExploreCountries: (...args: unknown[]) =>
      getFeaturedExploreCountriesMock(...args),
  };
});

vi.mock("@/lib/explore/country-flag-icons", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/explore/country-flag-icons")>();
  return {
    ...actual,
    getCountryFlagIconUrls: (...args: unknown[]) =>
      getCountryFlagIconUrlsMock(...args),
  };
});

vi.mock("@/flags", () => ({
  cardsWidgetUpdate: (...args: unknown[]) => cardsWidgetUpdateMock(...args),
}));

vi.mock("@/lib/city-cards/enrich-city-cards-for-listing", () => ({
  enrichCityCardsForListing: (...args: unknown[]) =>
    enrichCityCardsForListingMock(...args),
}));

vi.mock("./ExploreCatalogClient", () => ({
  default: ({
    featuredCountries,
  }: {
    featuredCountries?: Array<{ countryCode: string; country: string }>;
  }) => (
    <div
      data-testid="explore-catalog-client"
      data-featured={JSON.stringify(featuredCountries ?? null)}
    />
  ),
}));

import ExploreCatalog from "./ExploreCatalog";

const catalogSuccess = {
  success: true as const,
  data: [
    {
      id: "1",
      title: "Porto Walk",
      image: "/porto.jpg",
      countryCode: "PT",
      country: "Portugal",
    },
  ],
  totalHits: 1,
  completeCountryList: [
    { countryCode: "PT", country: "Portugal" },
    { countryCode: "ES", country: "Spain" },
  ],
};

describe("ExploreCatalog (async server entry)", () => {
  beforeEach(() => {
    getExploreCatalogPageMock.mockReset();
    getFeaturedExploreCountriesMock.mockReset();
    getCountryFlagIconUrlsMock.mockReset();
    cardsWidgetUpdateMock.mockReset();
    enrichCityCardsForListingMock.mockReset();
    cardsWidgetUpdateMock.mockResolvedValue(false);
    getCountryFlagIconUrlsMock.mockResolvedValue(new Map());
  });

  it("fetches catalog and featured countries together and passes the intersection", async () => {
    getExploreCatalogPageMock.mockResolvedValue(catalogSuccess);
    getFeaturedExploreCountriesMock.mockResolvedValue([
      { countryCode: "ES", country: "España" },
      { countryCode: "XX", country: "Atlantis" },
      { countryCode: "PT", country: "Portugal" },
    ]);

    const tree = await ExploreCatalog();
    render(tree);

    expect(getExploreCatalogPageMock).toHaveBeenCalledWith(1, undefined, true);
    expect(getFeaturedExploreCountriesMock).toHaveBeenCalled();
    expect(screen.getByTestId("explore-catalog-client")).toHaveAttribute(
      "data-featured",
      JSON.stringify([
        { countryCode: "PT", country: "Portugal" },
        { countryCode: "ES", country: "Spain" },
      ]),
    );
  });

  it("passes an empty featured list when Sanity returns none (fail open)", async () => {
    getExploreCatalogPageMock.mockResolvedValue(catalogSuccess);
    getFeaturedExploreCountriesMock.mockResolvedValue([]);

    const tree = await ExploreCatalog();
    render(tree);

    expect(screen.getByTestId("explore-catalog-client")).toHaveAttribute(
      "data-featured",
      "[]",
    );
  });

  it("still renders the catalog error UI when the catalog fetch fails", async () => {
    getExploreCatalogPageMock.mockResolvedValue({
      success: false,
      error: "Catalog down",
    });
    getFeaturedExploreCountriesMock.mockResolvedValue([
      { countryCode: "PT", country: "Portugal" },
    ]);

    const tree = await ExploreCatalog();
    render(tree);

    expect(
      screen.getByText("We couldn't load the tour catalog."),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("explore-catalog-client"),
    ).not.toBeInTheDocument();
  });
});
