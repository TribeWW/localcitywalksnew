/**
 * explore-catalog-store — Redis snapshot read/write helpers.
 *
 * Critical invariants:
 * - write stores listing fields only (strips price/rating enrichment)
 * - read round-trips a valid snapshot
 * - missing Redis / missing key / invalid payload → null or false (null-safe)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EXPLORE_CATALOG_SNAPSHOT_KEY,
  readExploreCatalogSnapshot,
  resetExploreCatalogRedisClientForTests,
  setExploreCatalogRedisClientForTests,
  writeExploreCatalogSnapshot,
} from "@/lib/explore/explore-catalog-store";
import type { CityCardData } from "@/types/bokun";

const sampleCards: CityCardData[] = [
  {
    id: "1077682",
    title: "Hello Toledo Private Walk",
    image: "https://example.com/toledo.jpg",
    countryCode: "ES",
    country: "Spain",
    cityName: "Toledo",
    citySlug: "toledo",
    slug: "hello-toledo-private-walk-1077682",
    defaultRateId: 123,
    displayPricePerPerson: 99,
    displayPriceCurrency: "EUR",
    ratingLabel: "4.7",
    showRating: true,
  },
];

const listingOnlyCards: CityCardData[] = [
  {
    id: "1077682",
    title: "Hello Toledo Private Walk",
    image: "https://example.com/toledo.jpg",
    countryCode: "ES",
    country: "Spain",
    cityName: "Toledo",
    citySlug: "toledo",
    slug: "hello-toledo-private-walk-1077682",
    defaultRateId: 123,
  },
];

describe("explore-catalog-store", () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    setExploreCatalogRedisClientForTests({
      get: mockGet,
      set: mockSet,
    } as never);
  });

  afterEach(() => {
    resetExploreCatalogRedisClientForTests();
  });

  describe("writeExploreCatalogSnapshot", () => {
    it("stores listing fields only and returns true", async () => {
      mockSet.mockResolvedValue("OK");

      const ok = await writeExploreCatalogSnapshot(sampleCards);

      expect(ok).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        EXPLORE_CATALOG_SNAPSHOT_KEY,
        listingOnlyCards,
      );
    });

    it("returns false when Redis is not configured", async () => {
      setExploreCatalogRedisClientForTests(null);

      const ok = await writeExploreCatalogSnapshot(sampleCards);

      expect(ok).toBe(false);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("returns false when Redis set throws", async () => {
      mockSet.mockRejectedValue(new Error("network"));

      const ok = await writeExploreCatalogSnapshot(sampleCards);

      expect(ok).toBe(false);
    });
  });

  describe("readExploreCatalogSnapshot", () => {
    it("returns the stored snapshot", async () => {
      mockGet.mockResolvedValue(listingOnlyCards);

      const result = await readExploreCatalogSnapshot();

      expect(mockGet).toHaveBeenCalledWith(EXPLORE_CATALOG_SNAPSHOT_KEY);
      expect(result).toEqual(listingOnlyCards);
    });

    it("returns null when Redis is not configured", async () => {
      setExploreCatalogRedisClientForTests(null);

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("returns null when the key is missing", async () => {
      mockGet.mockResolvedValue(null);

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
    });

    it("returns null when the payload is invalid", async () => {
      mockGet.mockResolvedValue([{ title: "missing id" }]);

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
    });

    it("returns null when Redis get throws", async () => {
      mockGet.mockRejectedValue(new Error("network"));

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
    });
  });
});
