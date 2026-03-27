"use server";

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { BOKUN_ENDPOINTS } from "@/lib/bokun/config";
// Single-product fetch uses PRODUCT_BY_ID only; URL slug is our format (slugify(title)-id), not Bokun's.
import type { BokunProductDetail, GetTourDetailResult } from "@/types/bokun";

/** In-memory cache for single-product responses; 15min TTL aligned with getProductsPage */
const detailCache = new Map<
  string,
  { data: BokunProductDetail; timestamp: number }
>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const REQUEST_TIMEOUT_MS = 5000;

/** Disallow path/query/fragment in id to avoid injection */
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Fetches full tour detail from Bokun by product id.
 * Used by the tour page after parsing id from the URL slug (slug format: slugifiedTitle-id).
 * @param id - Bokun product id (e.g. "1077682")
 * @returns GetTourDetailResult with data on success or error message on failure
 */
export async function getTourDetailById(
  id: string,
): Promise<GetTourDetailResult> {
  const trimmedId = id?.trim();
  if (!trimmedId || !SAFE_ID_REGEX.test(trimmedId)) {
    return { success: false, error: "Invalid product id" };
  }

  const cacheKey = `bokun-tour-${trimmedId}`;
  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { success: true, data: cached.data };
  }

  const path = BOKUN_ENDPOINTS.PRODUCT_BY_ID(trimmedId);
  const url = createBokunUrl(path);
  const headers = generateBokunHeaders("GET", path);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Tour not found" };
      }
      console.error(
        `Bokun tour detail failed: ${response.status} for id ${trimmedId}`,
      );
      return { success: false, error: "Unable to load tour" };
    }

    const raw = await response.json();
    const data = raw as BokunProductDetail;
    if (!data?.id || !data?.title) {
      console.error(
        "Bokun tour detail: invalid response shape for id",
        trimmedId,
      );
      return { success: false, error: "Unable to load tour" };
    }

    detailCache.set(cacheKey, { data, timestamp: Date.now() });
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Bokun tour detail request failed:", message);
    return { success: false, error: "Unable to load tour" };
  }
}
