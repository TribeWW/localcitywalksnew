import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { scheduleSyncFromSearchItems } from "@/lib/bokun/schedule-search-sync";
import { transformSearchProductToCityCard } from "@/lib/bokun/transform-search-product-to-city-card";
import {
  BokunProduct,
  BokunSearchResponse,
  CityCardData,
  GetProductsPageResult,
} from "@/types/bokun";

const exploreSortedCache = new Map<
  string,
  { sorted: CityCardData[]; timestamp: number }
>();

type ExploreSortedBuildResult =
  | { ok: true; sorted: CityCardData[] }
  | { ok: false; error: string };

/** One shared Promise per cacheKey while a cold build runs (dedupes concurrent misses). */
const inFlightBuilds = new Map<string, Promise<ExploreSortedBuildResult>>();

const CACHE_TTL = 15 * 60 * 1000;
const PAGE_SIZE = 20;
const EXPLORE_FETCH_TIMEOUT_MS = 12_000;

function buildCompleteCountryList(items: CityCardData[]) {
  const byCode = new Map<string, string>();
  for (const item of items) {
    const code = item.countryCode?.trim();
    if (!code) continue;
    const currentLabel = byCode.get(code);
    const incomingLabel = item.country?.trim() || "Unknown";
    const currentIsMissingOrUnknown =
      !currentLabel || currentLabel.trim() === "" || currentLabel === "Unknown";
    const incomingIsRealLabel = incomingLabel !== "Unknown";

    if (!byCode.has(code) || (currentIsMissingOrUnknown && incomingIsRealLabel)) {
      byCode.set(code, incomingLabel);
    }
  }
  return Array.from(byCode.entries())
    .map(([countryCode, country]) => ({ countryCode, country }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Fetches a single page of Bokun search results and returns validated items.
 *
 * Sends a POST search request to Bokun, optionally restricting results to the provided `countryCode`, and validates the response structure before returning items.
 *
 * @param page - Page number (will be normalized to an integer >= 1)
 * @param pageSize - Number of items requested for the page
 * @param countryCode - Optional ISO country code to filter results by country
 * @returns `ok: true` with `items` (array of `BokunProduct`) and optional `totalHits` when the response is valid; otherwise `ok: false` with an error message describing the failure
 */
async function fetchBokunSearchPageRaw(
  page: number,
  pageSize: number,
  countryCode?: string | null,
): Promise<
  | { ok: true; items: BokunProduct[]; totalHits?: number }
  | { ok: false; error: string }
> {
  try {
    const url = createBokunUrl("/activity.json/search");
    const headers = generateBokunHeaders("POST", "/activity.json/search");
    const body: {
      page: number;
      pageSize: number;
      sortField: string;
      facetFilters?: Array<{
        name: string;
        values: string[];
        excluded?: boolean;
      }>;
    } = {
      page: Math.max(1, Math.floor(page)),
      pageSize,
      sortField: "BEST_SELLING_GLOBAL",
    };
    if (countryCode) {
      body.facetFilters = [
        { name: "country", values: [countryCode], excluded: false },
      ];
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      EXPLORE_FETCH_TIMEOUT_MS,
    );
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(
        `Bokun API request failed with status: ${response.status}`,
      );
    }
    const data: BokunSearchResponse = await response.json();
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid response format from Bokun API");
    }
    return {
      ok: true,
      items: data.items as BokunProduct[],
      totalHits: data.totalHits,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Provide a deduplicated, alphabetically sorted array of CityCardData for the given country and sort direction, using an in-memory cache and deduplicating concurrent builds.
 *
 * @param countryCode - Optional ISO country code to filter results; pass `null` or `undefined` to include all countries.
 * @param sortAscending - When `true`, sort titles in ascending (A→Z) order; when `false`, sort in descending (Z→A) order.
 * @returns `{ ok: true, sorted }` with the resulting `CityCardData[]` on success, or `{ ok: false, error }` with an error message on failure.
 */
async function getOrBuildExploreSortedList(
  countryCode: string | null | undefined,
  sortAscending: boolean,
): Promise<ExploreSortedBuildResult> {
  const cacheKey = `bokun-explore-sorted-v1-${countryCode ?? "all"}-${sortAscending ? "alphaAsc" : "alphaDesc"}`;
  const cached = exploreSortedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ok: true, sorted: cached.sorted };
  }

  const inflight = inFlightBuilds.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const buildPromise = (async (): Promise<ExploreSortedBuildResult> => {
    try {
      const byId = new Map<string, CityCardData>();
      const allItems: BokunProduct[] = [];
      let totalHits: number | undefined;
      let page = 1;
      let first = true;

      while (true) {
        const res = await fetchBokunSearchPageRaw(page, PAGE_SIZE, countryCode);
        if (!res.ok) {
          return { ok: false, error: res.error };
        }
        if (first) {
          totalHits = res.totalHits;
          first = false;
        }
        allItems.push(...res.items);
        for (const p of res.items) {
          const card = transformSearchProductToCityCard(p);
          byId.set(card.id, card);
        }
        if (
          res.items.length === 0 ||
          (typeof totalHits === "number" && byId.size >= totalHits)
        ) {
          break;
        }
        if (res.items.length < PAGE_SIZE) {
          break;
        }
        page += 1;
        if (page > 500) {
          console.warn(
            "[Explore catalog] Stopped fetch after 500 pages safety cap",
          );
          break;
        }
      }
      if (allItems.length > 0) {
        scheduleSyncFromSearchItems(allItems);
      }

      const sorted = Array.from(byId.values()).sort((a, b) => {
        const cmp = a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
        return sortAscending ? cmp : -cmp;
      });

      exploreSortedCache.set(cacheKey, {
        sorted: [...sorted],
        timestamp: Date.now(),
      });

      return { ok: true, sorted };
    } finally {
      inFlightBuilds.delete(cacheKey);
    }
  })();

  inFlightBuilds.set(cacheKey, buildPromise);
  return buildPromise;
}

/**
 * Produce a paginated slice of the explore catalog filtered by country and sort direction.
 *
 * Retrieves the fully built, de-duplicated, alphabetically sorted catalog (cached when available),
 * then returns the requested page of results.
 *
 * @param page - 1-based page number (values less than 1 are normalized to 1)
 * @param countryCode - ISO country code to filter results; pass `null`/`undefined` or falsy to include all countries
 * @param sortAscending - `true` to sort titles ascending, `false` for descending
 * @returns An object with `success: true`, `data` as the page of `CityCardData[]`, and `totalHits` as the full catalog length; or `success: false` with an `error` message on failure.
 */
export async function getExploreCatalogPage(
  page: number,
  countryCode: string | null | undefined,
  sortAscending: boolean,
): Promise<GetProductsPageResult> {
  const pageNum = Math.max(1, Math.floor(page));
  try {
    const built = await getOrBuildExploreSortedList(countryCode, sortAscending);
    if (!built.ok) {
      return { success: false, error: built.error };
    }
    const { sorted } = built;
    const totalHits = sorted.length;
    const start = (pageNum - 1) * PAGE_SIZE;
    const data = sorted.slice(start, start + PAGE_SIZE);
    return {
      success: true,
      data,
      totalHits,
      completeCountryList: buildCompleteCountryList(sorted),
    };
  } catch (error) {
    console.error("Error building explore catalog page:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
