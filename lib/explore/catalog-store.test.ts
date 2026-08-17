/**
 * explore-catalog-store — Redis snapshot read/write helpers.
 *
 * Critical invariants:
 * - write persists listing + warm price fields (strips live rating enrichment)
 * - read round-trips a valid snapshot including display prices
 * - key is explore:catalog:v2
 * - missing Redis / missing key / invalid payload → null or false (null-safe)
 * - preview/staging skip Redis so they cannot read or overwrite the live snapshot
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EXPLORE_CATALOG_SNAPSHOT_KEY,
  readExploreCatalogSnapshot,
  resetExploreCatalogRedisClientForTests,
  setExploreCatalogRedisClientForTests,
  shouldUseExploreCatalogSnapshot,
  writeExploreCatalogSnapshot,
} from "@/lib/explore/catalog-store";
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

/** Listing + warm price fields; live rating enrichment stripped. */
const snapshotCards: CityCardData[] = [
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
  },
];

describe("explore-catalog-store", () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    // Default to production so Redis read/write is exercised; preview tests override.
    vi.stubEnv("VERCEL_ENV", "production");
    setExploreCatalogRedisClientForTests({
      get: mockGet,
      set: mockSet,
    } as never);
  });

  afterEach(() => {
    resetExploreCatalogRedisClientForTests();
    vi.unstubAllEnvs();
  });

  it("uses the v2 catalog key", () => {
    expect(EXPLORE_CATALOG_SNAPSHOT_KEY).toBe("explore:catalog:v2");
  });

  describe("shouldUseExploreCatalogSnapshot", () => {
    it("is true only on the production Vercel environment", () => {
      expect(shouldUseExploreCatalogSnapshot()).toBe(true);

      vi.stubEnv("VERCEL_ENV", "preview");
      expect(shouldUseExploreCatalogSnapshot()).toBe(false);

      vi.stubEnv("VERCEL_ENV", "development");
      expect(shouldUseExploreCatalogSnapshot()).toBe(false);

      vi.stubEnv("VERCEL_ENV", "");
      expect(shouldUseExploreCatalogSnapshot()).toBe(false);
    });
  });

  describe("writeExploreCatalogSnapshot", () => {
    it("stores listing + price fields, strips ratings, and returns true", async () => {
      mockSet.mockResolvedValue("OK");

      const ok = await writeExploreCatalogSnapshot(sampleCards);

      expect(ok).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        EXPLORE_CATALOG_SNAPSHOT_KEY,
        snapshotCards,
        { ex: 48 * 60 * 60 },
      );
      expect(mockSet.mock.calls[0][1][0]).not.toHaveProperty("ratingLabel");
      expect(mockSet.mock.calls[0][1][0]).not.toHaveProperty("showRating");
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

    it("skips Redis outside production so staging cannot overwrite the live snapshot", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");

      const ok = await writeExploreCatalogSnapshot(sampleCards);

      expect(ok).toBe(false);
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("readExploreCatalogSnapshot", () => {
    it("round-trips price fields from the stored snapshot", async () => {
      mockGet.mockResolvedValue(snapshotCards);

      const result = await readExploreCatalogSnapshot();

      expect(mockGet).toHaveBeenCalledWith(EXPLORE_CATALOG_SNAPSHOT_KEY);
      expect(result).toEqual(snapshotCards);
      expect(result?.[0]?.displayPricePerPerson).toBe(99);
      expect(result?.[0]?.displayPriceCurrency).toBe("EUR");
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

    it("returns null when displayPricePerPerson has an invalid shape", async () => {
      mockGet.mockResolvedValue([
        {
          ...snapshotCards[0],
          displayPricePerPerson: "not-a-number",
        },
      ]);

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
    });

    it("returns null when Redis get throws", async () => {
      mockGet.mockRejectedValue(new Error("network"));

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
    });

    it("skips Redis outside production so staging cannot read the live snapshot", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      mockGet.mockResolvedValue(snapshotCards);

      const result = await readExploreCatalogSnapshot();

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });
  });
});
