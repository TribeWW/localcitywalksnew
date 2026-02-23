"use server";

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { syncCitiesFromProducts } from "./city.actions";
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
 * Extract thumbnail URL from keyPhoto derived array
 * @param keyPhoto - The keyPhoto object from Bokun product
 * @returns The thumbnail URL or fallback image
 */
function extractThumbnailUrl(keyPhoto: unknown): string {
  const photoData = keyPhoto as {
    derived?: Array<{ name: string; url: string }>;
  };

  if (!photoData?.derived) {
    return "/placeholder-city.jpg"; // Fallback image
  }

  // Find thumbnail in derived array
  const thumbnail = photoData.derived.find((item) => item.name === "preview");

  if (thumbnail?.url) {
    return thumbnail.url;
  }

  // Fallback to first available derived image
  const firstDerived = photoData.derived.find((item) => item.url);
  return firstDerived?.url || "/placeholder-city.jpg";
}

/**
 * Transform Bokun product to CityCardData format
 * @param product - Raw product from Bokun API
 * @returns Transformed CityCardData object
 */
function transformProductToCityCard(product: unknown): CityCardData {
  const productData = product as {
    id: string;
    title: string;
    keyPhoto: unknown;
    googlePlace?: { city: string; country: string; countryCode: string };
  };
  return {
    id: productData.id,
    title: productData.googlePlace?.city ?? productData.title,
    image: extractThumbnailUrl(productData.keyPhoto),
    countryCode: productData.googlePlace?.countryCode ?? "",
    country: productData.googlePlace?.country ?? "Unknown",
  };
}

/**
 * Server action to fetch one page of products from Bokun API (pageSize 20).
 * Used for initial load and "Show more"; returns data + totalHits for pagination UI.
 * @param page - 1-based page number
 * @returns Promise<GetProductsPageResult>
 */
export async function getProductsPage(
  page: number,
): Promise<GetProductsPageResult> {
  const pageNum = Math.max(1, Math.floor(page));
  try {
    const cacheKey = `bokun-products-page-${pageNum}`;
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        page: pageNum,
        pageSize: PAGE_SIZE,
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

    const totalHits = data.totalHits ?? 0;

    syncCitiesFromProducts(data.items as BokunProduct[])
      .then((syncResult) => {
        if (syncResult.countries.created.length > 0) {
          console.log(
            "[Country Sync] Background: created",
            syncResult.countries.created.length,
            "countries:",
            syncResult.countries.created.join(", "),
          );
        }
        if (syncResult.cities.created.length > 0) {
          console.log(
            "[City Sync] Background: created",
            syncResult.cities.created.length,
            "cities:",
            syncResult.cities.created.join(", "),
          );
        }
        if (syncResult.cities.updated.length > 0) {
          console.log(
            "[City Sync] Background: migrated",
            syncResult.cities.updated.length,
            "cities:",
            syncResult.cities.updated.join(", "),
          );
        }
        if (syncResult.errors.length > 0) {
          console.error(
            "[City Sync] Background sync had",
            syncResult.errors.length,
            "error(s):",
            syncResult.errors
              .map((e) => `${e.type}:${e.identifier} - ${e.error}`)
              .join("; "),
          );
        }
      })
      .catch((error) => {
        console.error(
          "[City Sync] Background sync failed:",
          error instanceof Error ? error.message : error,
        );
      });

    const cityCards: CityCardData[] = data.items.map(
      transformProductToCityCard,
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
 * Server action to fetch all products from Bokun API
 * Includes caching, error handling, and timeout protection
 * @returns Promise<GetAllProductsResult>
 */
export async function getAllProducts(): Promise<GetAllProductsResult> {
  try {
    // Check cache first
    const cacheKey = "bokun-products";
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

    // Sync cities and countries to Sanity in background (fire-and-forget)
    // Does not block response; logging happens when sync completes or fails
    syncCitiesFromProducts(data.items as BokunProduct[])
      .then((syncResult) => {
        if (syncResult.countries.created.length > 0) {
          console.log(
            "[Country Sync] Background: created",
            syncResult.countries.created.length,
            "countries:",
            syncResult.countries.created.join(", "),
          );
        }
        if (syncResult.cities.created.length > 0) {
          console.log(
            "[City Sync] Background: created",
            syncResult.cities.created.length,
            "cities:",
            syncResult.cities.created.join(", "),
          );
        }
        if (syncResult.cities.updated.length > 0) {
          console.log(
            "[City Sync] Background: migrated",
            syncResult.cities.updated.length,
            "cities:",
            syncResult.cities.updated.join(", "),
          );
        }
        if (syncResult.errors.length > 0) {
          console.error(
            "[City Sync] Background sync had",
            syncResult.errors.length,
            "error(s):",
            syncResult.errors
              .map((e) => `${e.type}:${e.identifier} - ${e.error}`)
              .join("; "),
          );
        }
      })
      .catch((error) => {
        console.error(
          "[City Sync] Background sync failed:",
          error instanceof Error ? error.message : error,
        );
      });

    // Transform products to CityCardData format
    const cityCards: CityCardData[] = data.items.map(
      transformProductToCityCard,
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
