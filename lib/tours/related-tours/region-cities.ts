/**
 * region-cities — Sanity lookup of peer city slugs sharing the current tour's region.
 *
 * Used by related-tours selection (tier 2). Fail open: missing city / missing region /
 * fetch errors → `{ hasRegion: false, regionCitySlugs: [], regionName: null }`.
 */

import { slugifyForUrl } from "@/lib/utils";
import { client } from "@/sanity/lib/client";

/** Raw Sanity projection for published city documents (drafts excluded). */
export type RegionCitySanityRow = {
  cityCode?: string | null;
  name?: string | null;
  regionId?: string | null;
  regionName?: string | null;
};

/**
 * Result of resolving the current tour's Sanity city → shared region peers.
 *
 * `regionCitySlugs` includes slugified `cityCode` **and** `name` for every city
 * in the same region (so catalog `citySlug` can match either form).
 */
export type RelatedTourRegionCities = {
  hasRegion: boolean;
  regionCitySlugs: string[];
  regionName: string | null;
};

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/**
 * Published cities with optional region ref + name (drafts excluded).
 */
export const RELATED_TOUR_REGION_CITIES_QUERY = `*[_type == "city" && ${DRAFT_EXCLUDED}]{
  cityCode,
  name,
  "regionId": region._ref,
  "regionName": region->name
}`;

const NO_REGION: RelatedTourRegionCities = {
  hasRegion: false,
  regionCitySlugs: [],
  regionName: null,
};

/**
 * Builds the lookup key for the current tour city.
 *
 * Prefer slugified Bokun `cityCode` when it is non-empty and longer than 2
 * characters; otherwise fall back to the route `citySlug`.
 */
export function resolveCurrentCityKey(input: {
  citySlug: string;
  cityCode: string | null | undefined;
}): string {
  const code = input.cityCode?.trim() ?? "";
  if (code.length > 2) {
    return slugifyForUrl(code);
  }
  return input.citySlug;
}

/**
 * Pure resolver: find the Sanity city matching the current tour, then collect
 * all slug keys for cities that share its `regionId`.
 *
 * Matching: `slugifyForUrl(cityCode)` **or** `slugifyForUrl(name)` equals the
 * current-city key from {@link resolveCurrentCityKey}.
 */
export function resolveRegionCitiesFromRows(input: {
  rows: readonly RegionCitySanityRow[];
  citySlug: string;
  cityCode: string | null | undefined;
}): RelatedTourRegionCities {
  const key = resolveCurrentCityKey({
    citySlug: input.citySlug,
    cityCode: input.cityCode,
  });

  const current = input.rows.find((row) => rowMatchesCityKey(row, key));
  if (!current?.regionId) {
    return NO_REGION;
  }

  const regionId = current.regionId;
  const regionName = trimOrNull(current.regionName);
  const slugs = new Set<string>();

  for (const row of input.rows) {
    if (row.regionId !== regionId) continue;
    for (const slug of cityRowSlugs(row)) {
      slugs.add(slug);
    }
  }

  return {
    hasRegion: true,
    regionCitySlugs: [...slugs],
    regionName,
  };
}

/**
 * Fetches published Sanity cities (API, not CDN) and resolves region peers for
 * the current tour city.
 *
 * Uses `client.withConfig({ useCdn: false })` so Next.js Data Cache owns
 * freshness. Revalidate is 1 hour. On failure logs `[Related tours]` and
 * returns no-region.
 */
export async function getRelatedTourRegionCities(input: {
  citySlug: string;
  cityCode: string | null | undefined;
}): Promise<RelatedTourRegionCities> {
  try {
    const rows = await client
      .withConfig({ useCdn: false })
      .fetch<RegionCitySanityRow[]>(
        RELATED_TOUR_REGION_CITIES_QUERY,
        {},
        { next: { revalidate: 60 * 60 } },
      );

    return resolveRegionCitiesFromRows({
      rows: rows ?? [],
      citySlug: input.citySlug,
      cityCode: input.cityCode,
    });
  } catch (error) {
    console.error("[Related tours] Sanity region cities fetch failed", error);
    return NO_REGION;
  }
}

/**
 * True when the row's slugified `cityCode` or `name` equals `key`.
 */
function rowMatchesCityKey(row: RegionCitySanityRow, key: string): boolean {
  return cityRowSlugs(row).includes(key);
}

/**
 * Slug keys derived from a city row (`cityCode` and/or `name`).
 */
function cityRowSlugs(row: RegionCitySanityRow): string[] {
  const slugs: string[] = [];
  const code = trimOrNull(row.cityCode);
  const name = trimOrNull(row.name);
  if (code) slugs.push(slugifyForUrl(code));
  if (name) slugs.push(slugifyForUrl(name));
  return slugs;
}

/**
 * Trims a string; empty after trim → `null`.
 */
function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
