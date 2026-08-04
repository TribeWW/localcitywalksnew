/**
 * explore-catalog — unit tests for snapshot-backed explore catalog pagination.
 *
 * Catalog builds no longer trigger Sanity sync; provisioning runs via the daily cron job.
 * Reads prefer Redis snapshot + L1; Bokun is only used on miss.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: vi.fn(() => "https://bokun.test/activity.json/search"),
  generateBokunHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
}));

vi.mock("@/lib/bokun/transform-search-product-to-city-card", () => {
  const transformSearchProductToCityCard = vi.fn(
    (product: {
      id: string;
      title: string;
      googlePlace?: { countryCode?: string; country?: string };
    }) => ({
      id: product.id,
      title: product.title,
      image: "/test.jpg",
      countryCode: product.googlePlace?.countryCode ?? "PT",
      country: product.googlePlace?.country ?? "Portugal",
    }),
  );

  return {
    transformSearchProductToCityCard,
    mapSearchProductsToCityCards: (
      products: unknown[],
      _logContext?: string,
    ) =>
      products.map((product) =>
        transformSearchProductToCityCard(
          product as {
            id: string;
            title: string;
            googlePlace?: { countryCode?: string; country?: string };
          },
        ),
      ),
  };
});

const mockReadSnapshot = vi.fn();
const mockWriteSnapshot = vi.fn();

vi.mock("@/lib/explore/explore-catalog-store", () => ({
  readExploreCatalogSnapshot: (...args: unknown[]) => mockReadSnapshot(...args),
  writeExploreCatalogSnapshot: (...args: unknown[]) =>
    mockWriteSnapshot(...args),
}));

import {
  getExploreCatalogPage,
  resetExploreCatalogCacheForTests,
} from "@/lib/explore-catalog";
import type { CityCardData } from "@/types/bokun";

const snapshotCards: CityCardData[] = [
  {
    id: "1",
    title: "Athens Walk",
    image: "/athens.jpg",
    countryCode: "GR",
    country: "Greece",
  },
  {
    id: "2",
    title: "Porto Walk",
    image: "/porto.jpg",
    countryCode: "PT",
    country: "Portugal",
  },
  {
    id: "3",
    title: "Lisbon Walk",
    image: "/lisbon.jpg",
    countryCode: "PT",
    country: "Portugal",
  },
];

describe("getExploreCatalogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetExploreCatalogCacheForTests();
    mockReadSnapshot.mockResolvedValue(null);
    mockWriteSnapshot.mockResolvedValue(false);
  });

  afterEach(() => {
    resetExploreCatalogCacheForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("serves from Redis snapshot without calling Bokun", async () => {
    mockReadSnapshot.mockResolvedValue(snapshotCards);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getExploreCatalogPage(1, null, true);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.map((c) => c.title)).toEqual([
      "Athens Walk",
      "Lisbon Walk",
      "Porto Walk",
    ]);
    expect(result.totalHits).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockWriteSnapshot).not.toHaveBeenCalled();
  });

  it("filters by country and reverses sort from one snapshot", async () => {
    mockReadSnapshot.mockResolvedValue(snapshotCards);

    const asc = await getExploreCatalogPage(1, ["PT"], true);
    const desc = await getExploreCatalogPage(1, ["PT"], false);

    expect(asc.success).toBe(true);
    expect(desc.success).toBe(true);
    if (!asc.success || !desc.success) return;

    expect(asc.data.map((c) => c.title)).toEqual([
      "Lisbon Walk",
      "Porto Walk",
    ]);
    expect(desc.data.map((c) => c.title)).toEqual([
      "Porto Walk",
      "Lisbon Walk",
    ]);
    // Country list comes from the full snapshot, not the filtered subset
    expect(asc.completeCountryList).toEqual([
      { countryCode: "GR", country: "Greece" },
      { countryCode: "PT", country: "Portugal" },
    ]);
  });

  it("rebuilds from Bokun and writes Redis on snapshot miss", async () => {
    mockReadSnapshot.mockResolvedValue(null);
    mockWriteSnapshot.mockResolvedValue(true);

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

    const result = await getExploreCatalogPage(1, null, true);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockWriteSnapshot).toHaveBeenCalledTimes(1);
    expect(mockWriteSnapshot.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: "1", title: "Porto Walk" }),
    ]);
  });

  it("caches Bokun rebuild failures briefly and retries after cooldown", async () => {
    vi.useFakeTimers();
    mockReadSnapshot.mockResolvedValue(null);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExploreCatalogPage(1, null, true);
    const second = await getExploreCatalogPage(1, null, true);

    expect(first.success).toBe(false);
    expect(second.success).toBe(false);
    if (first.success || second.success) return;
    expect(first.error).toBe(second.error);
    // Cooldown should suppress a second crawl
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_000);

    fetchMock.mockResolvedValue({
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

    const third = await getExploreCatalogPage(1, null, true);

    expect(third.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("reuses L1 cache for same country set regardless of order", async () => {
    mockReadSnapshot.mockResolvedValue(null);

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
          {
            id: "2",
            title: "Athens Walk",
            keyPhoto: { derived: [{ name: "preview", url: "/athens.jpg" }] },
            googlePlace: {
              country: "Greece",
              countryCode: "GR",
              city: "Athens",
              cityCode: "athens",
            },
          },
        ],
        totalHits: 2,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExploreCatalogPage(1, ["PT", "GR"], true);
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await getExploreCatalogPage(1, ["GR", "PT"], true);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);

    expect(callsAfterFirst).toBeGreaterThan(0);
    // second call with same set (different order) should hit L1 — no extra Bokun
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
