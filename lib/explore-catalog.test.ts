import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: vi.fn(() => "https://bokun.test/activity.json/search"),
  generateBokunHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
}));

vi.mock("@/lib/bokun/schedule-search-sync", () => ({
  scheduleSyncFromSearchItems: vi.fn(),
}));

vi.mock("@/lib/bokun/transform-search-product-to-city-card", () => ({
  transformSearchProductToCityCard: vi.fn((product: { id: string; title: string }) => ({
    id: product.id,
    title: product.title,
    image: "/test.jpg",
    countryCode: "PT",
    country: "Portugal",
  })),
}));

import { getExploreCatalogPage } from "@/lib/explore-catalog";

describe("getExploreCatalogPage country set cache key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses cache for same country set regardless of order", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "1",
            title: "Porto Walk",
            keyPhoto: { derived: [{ name: "preview", url: "/porto.jpg" }] },
            googlePlace: { country: "Portugal", countryCode: "PT", city: "Porto", cityCode: "porto" },
          },
        ],
        totalHits: 1,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExploreCatalogPage(1, ["PT", "GR"], true);
    const second = await getExploreCatalogPage(1, ["GR", "PT"], true);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCallBody = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    const secondCallBody = JSON.parse(
      String((fetchMock.mock.calls[1][1] as RequestInit).body),
    );
    expect(firstCallBody.facetFilters[0].values).toHaveLength(1);
    expect(secondCallBody.facetFilters[0].values).toHaveLength(1);
    expect([
      firstCallBody.facetFilters[0].values[0],
      secondCallBody.facetFilters[0].values[0],
    ]).toEqual(expect.arrayContaining(["GR", "PT"]));
  });
});
