/**
 * sync-bokun-catalog cron — unit tests for price warm + explore snapshot write.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAll = vi.fn();
const mockMapToCards = vi.fn();
const mockWarmListingPrices = vi.fn();
const mockWriteSnapshot = vi.fn();
const mockSyncCities = vi.fn();
const mockIsAuthorized = vi.fn();
const mockUnauthorized = vi.fn(() =>
  Response.json({ error: "Unauthorized" }, { status: 401 }),
);

vi.mock("@/lib/bokun/fetch-all-search-products", () => ({
  fetchAllBokunSearchProducts: (...args: unknown[]) => mockFetchAll(...args),
}));

vi.mock("@/lib/bokun/transform-search-product-to-city-card", () => ({
  mapSearchProductsToCityCards: (...args: unknown[]) => mockMapToCards(...args),
}));

vi.mock("@/lib/city-cards/warm-listing-prices-for-cards", () => ({
  warmListingPricesForCards: (...args: unknown[]) =>
    mockWarmListingPrices(...args),
}));

vi.mock("@/lib/explore/catalog-store", () => ({
  writeExploreCatalogSnapshot: (...args: unknown[]) =>
    mockWriteSnapshot(...args),
}));

vi.mock("@/lib/actions/city.actions", () => ({
  syncCitiesFromProducts: (...args: unknown[]) => mockSyncCities(...args),
}));

vi.mock("@/lib/cron/verify-cron-request", () => ({
  isCronRequestAuthorized: (...args: unknown[]) => mockIsAuthorized(...args),
  cronUnauthorizedResponse: () => mockUnauthorized(),
}));

import { GET } from "@/app/api/cron/sync-bokun-catalog/route";

const sampleProducts = [
  {
    id: "1",
    title: "Porto Walk",
    keyPhoto: { derived: [] },
  },
];

const sampleCards = [
  {
    id: "1",
    title: "Porto Walk",
    image: "/porto.jpg",
    countryCode: "PT",
    country: "Portugal",
  },
];

const pricedCards = [
  {
    ...sampleCards[0],
    defaultRateId: 2199582,
    displayPricePerPerson: 62,
    displayPriceCurrency: "EUR",
  },
];

function authorizedRequest() {
  return new Request("http://localhost/api/cron/sync-bokun-catalog", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

describe("GET /api/cron/sync-bokun-catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthorized.mockReturnValue(true);
    mockFetchAll.mockResolvedValue({ ok: true, products: sampleProducts });
    mockMapToCards.mockReturnValue(sampleCards);
    mockWarmListingPrices.mockResolvedValue(pricedCards);
    mockWriteSnapshot.mockResolvedValue(true);
    mockSyncCities.mockResolvedValue({
      countries: { created: [], updated: [] },
      cities: { created: [], updated: [], existing: [] },
      errors: [],
      tourSeo: { created: [], existing: [] },
    });
  });

  it("rejects unauthorized requests without writing the snapshot", async () => {
    mockIsAuthorized.mockReturnValue(false);

    const res = await GET(authorizedRequest());

    expect(res.status).toBe(401);
    expect(mockFetchAll).not.toHaveBeenCalled();
    expect(mockWarmListingPrices).not.toHaveBeenCalled();
    expect(mockWriteSnapshot).not.toHaveBeenCalled();
  });

  it("warms listing prices then writes the explore catalog snapshot", async () => {
    const res = await GET(authorizedRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockMapToCards).toHaveBeenCalledWith(
      sampleProducts,
      "cron/sync-bokun-catalog",
    );
    expect(mockWarmListingPrices).toHaveBeenCalledTimes(1);
    expect(mockWarmListingPrices).toHaveBeenCalledWith(sampleCards);
    expect(mockWriteSnapshot).toHaveBeenCalledTimes(1);
    expect(mockWriteSnapshot).toHaveBeenCalledWith(pricedCards);
    expect(body).toMatchObject({
      success: true,
      bokunProductsFetched: 1,
      exploreCatalogSnapshotWritten: true,
    });
  });

  it("skips warm and snapshot write when Bokun catalog fetch fails", async () => {
    mockFetchAll.mockResolvedValue({
      ok: false,
      error: "Bokun unavailable",
    });

    const res = await GET(authorizedRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(mockWarmListingPrices).not.toHaveBeenCalled();
    expect(mockWriteSnapshot).not.toHaveBeenCalled();
    expect(mockSyncCities).not.toHaveBeenCalled();
    expect(body).toEqual({
      success: false,
      error: "Bokun unavailable",
    });
  });

  it("reports exploreCatalogSnapshotWritten false when Redis write fails", async () => {
    mockWriteSnapshot.mockResolvedValue(false);

    const res = await GET(authorizedRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockWarmListingPrices).toHaveBeenCalledWith(sampleCards);
    expect(mockWriteSnapshot).toHaveBeenCalledWith(pricedCards);
    expect(body.exploreCatalogSnapshotWritten).toBe(false);
    expect(mockSyncCities).toHaveBeenCalledWith(sampleProducts);
  });
});
