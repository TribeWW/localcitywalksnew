/**
 * featured-countries — Sanity loader + pure intersection for explore quick filters.
 *
 * Fetches published countries flagged `featuredOnExplore`, maps them to catalog
 * country shape, and intersects with the live Bokun `completeCountryList`.
 * Fail open: fetch errors return `[]` so the explore picker still renders.
 */

import { client } from "@/sanity/lib/client";
import { FEATURED_EXPLORE_MAX } from "@/sanity/schemaTypes/country.helpers";

/** Country option shape shared with explore catalog / quick filters. */
export type FeaturedCountry = {
  countryCode: string;
  country: string;
};

/** Raw Sanity projection for featured country documents. */
type FeaturedCountrySanityRow = {
  iso2?: string | null;
  name?: string | null;
};

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/**
 * Published countries with `featuredOnExplore` enabled (drafts excluded).
 *
 * Projects `iso2` and `name` only; mapping to {@link FeaturedCountry} happens in
 * {@link getFeaturedExploreCountries}.
 */
export const FEATURED_EXPLORE_COUNTRIES_QUERY = `*[_type == "country" && featuredOnExplore == true && ${DRAFT_EXCLUDED}]{
  iso2,
  name
}`;

/**
 * Intersects Sanity featured countries with the catalog country list.
 *
 * Matching key is ISO2 (`countryCode`). Results use catalog display names,
 * sorted A–Z by name, then sliced to {@link FEATURED_EXPLORE_MAX}.
 *
 * @param featured - Featured countries from Sanity (may include codes absent from catalog)
 * @param completeCountryList - Full catalog country list from the explore snapshot
 * @returns Up to five quick-filter countries present in both sources
 */
export function intersectFeaturedWithCatalog(
  featured: FeaturedCountry[],
  completeCountryList: FeaturedCountry[],
): FeaturedCountry[] {
  const featuredCodes = new Set(
    featured.map((entry) => entry.countryCode).filter(Boolean),
  );

  return completeCountryList
    .filter((entry) => featuredCodes.has(entry.countryCode))
    .sort((a, b) => a.country.localeCompare(b.country))
    .slice(0, FEATURED_EXPLORE_MAX);
}

/**
 * Fetches featured explore countries from Sanity (API, not CDN).
 *
 * Uses `client.withConfig({ useCdn: false })` so Next.js `{ revalidate: 60 }`
 * owns freshness (avoids stacking Sanity CDN cache). On failure logs with
 * prefix `[Explore featured countries]` and returns `[]`.
 *
 * @returns Featured countries as `{ countryCode, country }[]`, or empty on error
 */
export async function getFeaturedExploreCountries(): Promise<FeaturedCountry[]> {
  try {
    const rows = await client
      .withConfig({ useCdn: false })
      .fetch<FeaturedCountrySanityRow[]>(
        FEATURED_EXPLORE_COUNTRIES_QUERY,
        {},
        { next: { revalidate: 60 } },
      );

    return (rows ?? []).flatMap((row) => {
      if (
        !row ||
        typeof row.iso2 !== "string" ||
        row.iso2.trim() === "" ||
        typeof row.name !== "string" ||
        row.name.trim() === ""
      ) {
        return [];
      }

      return [{ countryCode: row.iso2, country: row.name }];
    });
  } catch (error) {
    console.error("[Explore featured countries] Sanity fetch failed", error);
    return [];
  }
}
