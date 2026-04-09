"use server";

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { scheduleSyncFromSearchItems } from "@/lib/bokun/schedule-search-sync";
import { transformSearchProductToCityCard } from "@/lib/bokun/transform-search-product-to-city-card";
import { getExploreCatalogPage as loadExploreCatalogPage } from "@/lib/explore-catalog";
import {
  BokunProduct,
  BokunSearchResponse,
  CityCardData,
  GetAllProductsResult,
  GetProductsPageResult,
} from "@/types/bokun";

/**
 * Simple in-memory cache with 15-minute TTL
 */
const cache = new Map<string, { data: CityCardData[]; timestamp: number }>();
/** Per-page cache for getProductsPage (data + totalHits) */
const pageCache = new Map<
  string,
  { data: CityCardData[]; totalHits: number; timestamp: number }
>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const PAGE_SIZE = 20;

/**
 * Retrieves a single page of the explore catalog, optionally filtered by country and ordered by ascending or descending sort.
 *
 * @param page - The page number to retrieve (1-based).
 * @param countryCode - Optional ISO country code to filter results; pass `null` or `undefined` to omit the country filter.
 * @param sortAscending - If `true`, sort results in ascending order; if `false`, sort in descending order.
 * @returns A GetProductsPageResult containing the page's city card data and `totalHits` on success, or an error message on failure.
 */
export async function getExploreCatalogPage(
  page: number,
  countryCode: string | null | undefined,
  sortAscending: boolean,
): Promise<GetProductsPageResult> {
  return loadExploreCatalogPage(page, countryCode, sortAscending);
}

/**
 * Fetches one page of products from the Bokun API and returns city card data plus total hit count for pagination.
 *
 * Requests use a page size of 20 and sort by best-selling items. When `countryCode` is provided the request includes facet filters so the API returns results only for that country.
 *
 * @param page - 1-based page number (values are floored and coerced to at least 1)
 * @param countryCode - Optional ISO2 country code (e.g., "FR", "ES"); when provided the server-side request restricts results to this country
 * @returns `GetProductsPageResult` containing `data` (array of `CityCardData`) and `totalHits` when `success` is `true`; otherwise an `error` message
 */
export async function getProductsPage(
  page: number,
  countryCode?: string | null,
): Promise<GetProductsPageResult> {
  const pageNum = Math.max(1, Math.floor(page));
  const cacheKey = `bokun-products-page-v2-${pageNum}-${countryCode ?? "all"}`;
  try {
    const cached = pageCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        data: cached.data,
        totalHits: cached.totalHits,
      };
    }

    const url = createBokunUrl("/activity.json/search");
    const headers = generateBokunHeaders("POST", "/activity.json/search");

    const body: {
      page: number;
      pageSize: number;
      sortField: string;
      facetFilters?: Array<{ name: string; values: string[]; excluded?: boolean }>;
    } = {
      page: pageNum,
      pageSize: PAGE_SIZE,
      sortField: "BEST_SELLING_GLOBAL",
    };
    if (countryCode) {
      body.facetFilters = [
        { name: "country", values: [countryCode], excluded: false },
      ];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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

    const totalHits = data.totalHits ?? 0;

    scheduleSyncFromSearchItems(data.items as BokunProduct[]);

    const cityCards: CityCardData[] = data.items.map(
      transformSearchProductToCityCard,
    );

    pageCache.set(cacheKey, {
      data: cityCards,
      totalHits,
      timestamp: Date.now(),
    });

    return {
      success: true,
      data: cityCards,
      totalHits,
    };
  } catch (error) {
    console.error("Error fetching products page from Bokun API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches products from the Bokun API, transforms them into `CityCardData` items, schedules background synchronization, and caches the result.
 *
 * Uses an in-memory cache with a 15-minute TTL and enforces a 5-second request timeout. On success stores transformed products in the cache and returns them; on failure returns an error message.
 *
 * @returns An object with `success: true` and `data: CityCardData[]` when the request and transformation succeed; otherwise `success: false` and `error` containing a human-readable message.
 */
export async function getAllProducts(): Promise<GetAllProductsResult> {
  try {
    // Check cache first
    const cacheKey = "bokun-products-v2";
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        data: cached.data,
      };
    }

    // Create API request
    const url = createBokunUrl("/activity.json/search");
    const headers = generateBokunHeaders("POST", "/activity.json/search");

    // Make API request with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        page: 1,
        pageSize: 50,
        sortField: "BEST_SELLING_GLOBAL",
      }),
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

    scheduleSyncFromSearchItems(data.items as BokunProduct[]);

    // Transform products to CityCardData format
    const cityCards: CityCardData[] = data.items.map(
      transformSearchProductToCityCard,
    );

    // Update cache
    cache.set(cacheKey, {
      data: cityCards,
      timestamp: Date.now(),
    });

    return {
      success: true,
      data: cityCards,
    };
  } catch (error) {
    console.error("Error fetching products from Bokun API:", error);

    // Return error result
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
