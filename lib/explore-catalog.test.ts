import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: vi.fn(() => "https://bokun.test/activity.json/search"),
  generateBokunHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
}));

vi.mock("@/lib/bokun/schedule-search-sync", () => ({
  scheduleSyncFromSearchItems: vi.fn(),
}));

vi.mock("@/lib/bokun/transform-search-product-to-city-card", () => ({
  transformSearchProductToCityCard: vi.fn(
    (product: { id: string; title: string }) => ({
      id: product.id,
      title: product.title,
      image: "/test.jpg",
      countryCode: "PT",
      country: "Portugal",
    }),
  ),
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
            googlePlace: {
              country: "Portugal",
              countryCode: "PT",
              city: "Porto",
              cityCode: "porto",
            },
          },
        ],
        totalHits: 1,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExploreCatalogPage(1, ["PT", "GR"], true);
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await getExploreCatalogPage(1, ["GR", "PT"], true);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);

    expect(callsAfterFirst).toBeGreaterThan(0);
    // second call with same set (different order) should hit cache
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
