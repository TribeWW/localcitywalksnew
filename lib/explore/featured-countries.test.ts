/**
 * featured-countries — unit tests for explore featured-country fetch and intersection.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

import {
  getFeaturedExploreCountries,
  intersectFeaturedWithCatalog,
  type FeaturedCountry,
} from "./featured-countries";

const CATALOG: FeaturedCountry[] = [
  { countryCode: "AT", country: "Austria" },
  { countryCode: "FR", country: "France" },
  { countryCode: "ES", country: "Spain" },
  { countryCode: "PT", country: "Portugal" },
  { countryCode: "DE", country: "Germany" },
  { countryCode: "IT", country: "Italy" },
  { countryCode: "GR", country: "Greece" },
];

describe("intersectFeaturedWithCatalog", () => {
  it("intersects by ISO2, sorts A–Z by name, and slices to five", () => {
    const featured: FeaturedCountry[] = [
      { countryCode: "ES", country: "Spain" },
      { countryCode: "IT", country: "Italy" },
      { countryCode: "FR", country: "France" },
      { countryCode: "DE", country: "Germany" },
      { countryCode: "PT", country: "Portugal" },
      { countryCode: "GR", country: "Greece" },
    ];

    expect(intersectFeaturedWithCatalog(featured, CATALOG)).toEqual([
      { countryCode: "FR", country: "France" },
      { countryCode: "DE", country: "Germany" },
      { countryCode: "GR", country: "Greece" },
      { countryCode: "IT", country: "Italy" },
      { countryCode: "PT", country: "Portugal" },
    ]);
  });

  it("drops featured countries missing from the catalog", () => {
    const featured: FeaturedCountry[] = [
      { countryCode: "ES", country: "Spain" },
      { countryCode: "XX", country: "Atlantis" },
    ];

    expect(intersectFeaturedWithCatalog(featured, CATALOG)).toEqual([
      { countryCode: "ES", country: "Spain" },
    ]);
  });

  it("returns an empty list when nothing intersects", () => {
    expect(
      intersectFeaturedWithCatalog(
        [{ countryCode: "XX", country: "Atlantis" }],
        CATALOG,
      ),
    ).toEqual([]);
  });

  it("uses catalog display names after intersection", () => {
    const featured: FeaturedCountry[] = [
      { countryCode: "ES", country: "España" },
    ];

    expect(intersectFeaturedWithCatalog(featured, CATALOG)).toEqual([
      { countryCode: "ES", country: "Spain" },
    ]);
  });
});

describe("getFeaturedExploreCountries", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("maps Sanity iso2/name rows to countryCode/country", async () => {
    fetchMock.mockResolvedValue([
      { iso2: "ES", name: "Spain" },
      { iso2: "FR", name: "France" },
    ]);

    await expect(getFeaturedExploreCountries()).resolves.toEqual([
      { countryCode: "ES", country: "Spain" },
      { countryCode: "FR", country: "France" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      {},
      { next: { revalidate: 60 } },
    );
  });

  it("skips rows missing iso2 or name", async () => {
    fetchMock.mockResolvedValue([
      { iso2: "ES", name: "Spain" },
      { iso2: "FR" },
      { name: "Germany" },
      null,
    ]);

    await expect(getFeaturedExploreCountries()).resolves.toEqual([
      { countryCode: "ES", country: "Spain" },
    ]);
  });

  it("returns [] and logs when the Sanity fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("Sanity down"));

    await expect(getFeaturedExploreCountries()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[Explore featured countries]"),
      expect.any(Error),
    );
  });
});
