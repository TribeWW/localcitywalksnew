/**
 * fetch-all-search-products — paginated Bokun catalog fetch for sync and listing routes.
 *
 * Shared by the explore catalog build and the daily cron sync endpoint.
 */

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import type { BokunProduct, BokunSearchResponse } from "@/types/bokun";

export const BOKUN_SEARCH_PAGE_SIZE = 20;
export const BOKUN_SEARCH_MAX_PAGES = 500;
const BOKUN_SEARCH_TIMEOUT_MS = 12_000;

export type FetchBokunSearchPageResult =
  | { ok: true; items: BokunProduct[]; totalHits?: number }
  | { ok: false; error: string };

export type FetchAllBokunSearchProductsResult =
  | { ok: true; products: BokunProduct[] }
  | { ok: false; error: string };

/**
 * Fetches one page from Bokun `POST /activity.json/search`.
 *
 * @param page - 1-based page number
 * @param pageSize - Items per page
 * @param countryCode - Optional ISO2 country filter
 */
export async function fetchBokunSearchPageRaw(
  page: number,
  pageSize: number,
  countryCode?: string,
): Promise<FetchBokunSearchPageResult> {
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
      BOKUN_SEARCH_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

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
 * Loads the full Bokun search catalog (all countries) by paging until exhausted.
 *
 * @returns All products from the search API, or an error when a page fetch fails
 */
export async function fetchAllBokunSearchProducts(): Promise<FetchAllBokunSearchProductsResult> {
  const products: BokunProduct[] = [];
  let totalHits: number | undefined;
  let page = 1;

  while (true) {
    const res = await fetchBokunSearchPageRaw(
      page,
      BOKUN_SEARCH_PAGE_SIZE,
      undefined,
    );
    if (!res.ok) {
      return { ok: false, error: res.error };
    }

    if (page === 1) {
      totalHits = res.totalHits;
    }

    products.push(...res.items);

    if (
      res.items.length === 0 ||
      (typeof totalHits === "number" &&
        page * BOKUN_SEARCH_PAGE_SIZE >= totalHits)
    ) {
      break;
    }
    if (res.items.length < BOKUN_SEARCH_PAGE_SIZE) {
      break;
    }

    page += 1;
    if (page > BOKUN_SEARCH_MAX_PAGES) {
      console.warn(
        "[Bokun search] Stopped fetch after max pages safety cap",
        BOKUN_SEARCH_MAX_PAGES,
      );
      break;
    }
  }

  return { ok: true, products };
}
