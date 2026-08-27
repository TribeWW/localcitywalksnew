/**
 * region-cities — unit tests for related-tours Sanity region lookup.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const withConfigMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
    withConfig: (...args: unknown[]) => {
      withConfigMock(...args);
      return {
        fetch: (...fetchArgs: unknown[]) => fetchMock(...fetchArgs),
      };
    },
  },
}));

import {
  getRelatedTourRegionCities,
  resolveRegionCitiesFromRows,
  type RegionCitySanityRow,
} from "@/lib/tours/related-tours/region-cities";

const PROVENCE_ROWS: RegionCitySanityRow[] = [
  {
    cityCode: "AIX",
    name: "Aix-en-Provence",
    regionId: "region-provence",
    regionName: "Provence",
  },
  {
    cityCode: "AVIGNON",
    name: "Avignon",
    regionId: "region-provence",
    regionName: "Provence",
  },
  {
    cityCode: "ARLES",
    name: "Arles",
    regionId: "region-provence",
    regionName: "Provence",
  },
  {
    cityCode: "BORDEAUX",
    name: "Bordeaux",
    regionId: "region-aquitaine",
    regionName: "Aquitaine",
  },
  {
    cityCode: "LYON",
    name: "Lyon",
    regionId: null,
    regionName: null,
  },
];

describe("resolveRegionCitiesFromRows", () => {
  it("matches the current city by slugified cityCode and returns region peers", () => {
    const result = resolveRegionCitiesFromRows({
      rows: PROVENCE_ROWS,
      citySlug: "avignon",
      cityCode: "AVIGNON",
    });

    expect(result.hasRegion).toBe(true);
    expect(result.regionName).toBe("Provence");
    expect(result.regionCitySlugs).toEqual(
      expect.arrayContaining([
        "aix",
        "aix-en-provence",
        "avignon",
        "arles",
      ]),
    );
    expect(result.regionCitySlugs).not.toContain("bordeaux");
    expect(result.regionCitySlugs).not.toContain("lyon");
  });

  it("matches the current city by slugified Sanity name when cityCode differs", () => {
    const rows: RegionCitySanityRow[] = [
      {
        cityCode: "XYZ",
        name: "Avignon",
        regionId: "region-provence",
        regionName: "Provence",
      },
      {
        cityCode: "AIX",
        name: "Aix-en-Provence",
        regionId: "region-provence",
        regionName: "Provence",
      },
    ];

    const result = resolveRegionCitiesFromRows({
      rows,
      citySlug: "avignon",
      // Short / unusable Bokun code → key falls back to citySlug, matched via name.
      cityCode: "AV",
    });

    expect(result.hasRegion).toBe(true);
    expect(result.regionName).toBe("Provence");
    expect(result.regionCitySlugs).toEqual(
      expect.arrayContaining(["avignon", "aix", "aix-en-provence", "xyz"]),
    );
  });

  it("uses citySlug as the key when Bokun cityCode is empty or length ≤ 2", () => {
    const byEmpty = resolveRegionCitiesFromRows({
      rows: PROVENCE_ROWS,
      citySlug: "avignon",
      cityCode: "",
    });
    const byShort = resolveRegionCitiesFromRows({
      rows: PROVENCE_ROWS,
      citySlug: "avignon",
      cityCode: "AV",
    });

    expect(byEmpty.hasRegion).toBe(true);
    expect(byShort.hasRegion).toBe(true);
    expect(byEmpty.regionName).toBe("Provence");
  });

  it("returns no region when the current city is missing from Sanity", () => {
    expect(
      resolveRegionCitiesFromRows({
        rows: PROVENCE_ROWS,
        citySlug: "unknown-city",
        cityCode: "UNKNOWN",
      }),
    ).toEqual({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });
  });

  it("returns no region when the matched city has no regionId", () => {
    expect(
      resolveRegionCitiesFromRows({
        rows: PROVENCE_ROWS,
        citySlug: "lyon",
        cityCode: "LYON",
      }),
    ).toEqual({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });
  });

  it("dedupes regionCitySlugs when cityCode and name slugify to the same value", () => {
    const rows: RegionCitySanityRow[] = [
      {
        cityCode: "Avignon",
        name: "Avignon",
        regionId: "region-provence",
        regionName: "Provence",
      },
    ];

    const result = resolveRegionCitiesFromRows({
      rows,
      citySlug: "avignon",
      cityCode: "Avignon",
    });

    expect(result.regionCitySlugs).toEqual(["avignon"]);
  });
});

describe("getRelatedTourRegionCities", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    withConfigMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("fetches published cities without CDN and resolves the region", async () => {
    fetchMock.mockResolvedValue(PROVENCE_ROWS);

    await expect(
      getRelatedTourRegionCities({
        citySlug: "avignon",
        cityCode: "AVIGNON",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        hasRegion: true,
        regionName: "Provence",
      }),
    );

    expect(withConfigMock).toHaveBeenCalledWith({ useCdn: false });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('_type == "city"'),
      {},
      { next: { revalidate: 60 * 60 } },
    );
  });

  it("returns no region and logs when the Sanity fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("Sanity down"));

    await expect(
      getRelatedTourRegionCities({
        citySlug: "avignon",
        cityCode: "AVIGNON",
      }),
    ).resolves.toEqual({
      hasRegion: false,
      regionCitySlugs: [],
      regionName: null,
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[Related tours]"),
      expect.any(Error),
    );
  });
});
