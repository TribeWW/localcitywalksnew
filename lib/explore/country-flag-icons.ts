/**
 * country-flag-icons — Sanity loader for explore country picker flag URLs.
 *
 * Fetches published country `flagIcon` asset URLs keyed by ISO2, then merges
 * onto Bokun-derived catalog country options. Fail open: fetch errors return
 * an empty map so the picker still renders without flags.
 */

import { client } from "@/sanity/lib/client";

/** Catalog country option that may carry a Sanity flag icon URL. */
export type CountryWithOptionalFlag = {
  countryCode: string;
  country: string;
  flagIconUrl?: string | null;
};

/** Raw Sanity projection for country flag icons. */
type CountryFlagSanityRow = {
  iso2?: string | null;
  flagIconUrl?: string | null;
};

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/**
 * Published countries with optional `flagIcon` asset URL (drafts excluded).
 */
export const COUNTRY_FLAG_ICONS_QUERY = `*[_type == "country" && ${DRAFT_EXCLUDED}]{
  iso2,
  "flagIconUrl": flagIcon.asset->url
}`;

/**
 * Builds a map of ISO2 → flag icon URL from Sanity rows.
 *
 * @param rows - Raw Sanity projection rows
 * @returns Map of uppercase ISO2 to non-empty flag URL strings
 */
export function buildFlagIconUrlMap(
  rows: CountryFlagSanityRow[] | null | undefined,
): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows ?? []) {
    if (
      !row ||
      typeof row.iso2 !== "string" ||
      row.iso2.trim() === "" ||
      typeof row.flagIconUrl !== "string" ||
      row.flagIconUrl.trim() === ""
    ) {
      continue;
    }

    map.set(row.iso2.trim().toUpperCase(), row.flagIconUrl.trim());
  }

  return map;
}

/**
 * Merges Sanity flag icon URLs onto catalog country options by ISO2.
 *
 * @param countries - Bokun-derived catalog country list
 * @param flagIconUrls - Map of ISO2 → flag asset URL
 * @returns Country list with optional `flagIconUrl` when a match exists
 */
export function mergeFlagIconsOntoCountries<T extends { countryCode: string }>(
  countries: T[],
  flagIconUrls: Map<string, string>,
): Array<T & { flagIconUrl?: string }> {
  return countries.map((entry) => {
    const code = entry.countryCode?.trim().toUpperCase();
    const flagIconUrl = code ? flagIconUrls.get(code) : undefined;
    if (!flagIconUrl) {
      return entry;
    }
    return { ...entry, flagIconUrl };
  });
}

/**
 * Fetches country flag icon URLs from Sanity (API, not CDN).
 *
 * Uses `client.withConfig({ useCdn: false })` so Next.js Data Cache owns
 * freshness. Revalidate is 1 hour to match `/explore` page ISR. On failure
 * logs with prefix `[Explore country flags]` and returns an empty map.
 *
 * @returns Map of ISO2 → flag icon asset URL, or empty on error
 */
export async function getCountryFlagIconUrls(): Promise<Map<string, string>> {
  try {
    const rows = await client
      .withConfig({ useCdn: false })
      .fetch<CountryFlagSanityRow[]>(
        COUNTRY_FLAG_ICONS_QUERY,
        {},
        { next: { revalidate: 60 * 60 } },
      );

    return buildFlagIconUrlMap(rows);
  } catch (error) {
    console.error("[Explore country flags] Sanity fetch failed", error);
    return new Map();
  }
}
