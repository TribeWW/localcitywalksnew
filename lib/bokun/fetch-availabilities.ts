/**
 * Bókun availabilities fetch with HMAC auth and in-memory TTL cache.
 *
 * Calls `GET /activity.json/{id}/availabilities` for live booking-widget slots
 * (pricing, sold-out flags, start times). Used by booking-widget server actions;
 * not for listing-card enrichment.
 */

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { BOKUN_ENDPOINTS } from "@/lib/bokun/config";
import type { BokunAvailability, BokunAvailabilitiesParams } from "@/types/bokun";

/** In-memory cache TTL — aligned with `getTourDetailById` (15 minutes). */
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Abort Bókun request after 5 seconds (aligned with price-list / tour detail). */
const REQUEST_TIMEOUT_MS = 5000;

/** Default `lang` query param when caller omits it. */
const DEFAULT_LANG = "EN";

/** Default `currency` query param per LOC-1041. */
const DEFAULT_CURRENCY = "EUR";

const availabilitiesCache = new Map<
  string,
  { data: BokunAvailability[]; timestamp: number }
>();

/** Result of `fetchAvailabilities` — mirrors `{ success, data?, error? }` server-action pattern. */
export type FetchAvailabilitiesResult =
  | { success: true; data: BokunAvailability[] }
  | { success: false; error: string };

/**
 * Builds the in-memory cache key for an availabilities request.
 * Keyed by `productId + start + end + currency` (lang / includeSoldOut excluded).
 */
export function buildAvailabilitiesCacheKey(
  productId: string,
  start: string,
  end: string,
  currency: string,
): string {
  return `bokun-availabilities-${productId}-${start}-${end}-${currency}`;
}

/** Clears the module-level availabilities cache (intended for unit tests). */
export function clearAvailabilitiesCache(): void {
  availabilitiesCache.clear();
}

/** Signed request path including query string for HMAC and `createBokunUrl`. */
function buildAvailabilitiesPath(
  productId: string,
  params: BokunAvailabilitiesParams,
): string {
  const basePath = BOKUN_ENDPOINTS.AVAILABILITIES(productId);
  const searchParams = new URLSearchParams({
    start: params.start,
    end: params.end,
    lang: params.lang ?? DEFAULT_LANG,
    currency: params.currency ?? DEFAULT_CURRENCY,
    includeSoldOut: String(params.includeSoldOut ?? false),
  });

  return `${basePath}?${searchParams.toString()}`;
}

/** Minimal shape check before caching a slot (fields required by quote + widget UI). */
function isValidAvailabilityRow(row: unknown): row is BokunAvailability {
  if (!row || typeof row !== "object") {
    return false;
  }

  const candidate = row as BokunAvailability;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.startTimeId === "number" &&
    typeof candidate.date === "number" &&
    Array.isArray(candidate.pricesByRate) &&
    Array.isArray(candidate.guidedLanguages) &&
    typeof candidate.soldOut === "boolean"
  );
}

/**
 * Fetches Bókun availability slots for a product and inclusive date range.
 *
 * Server-only: signs with HMAC, applies a 5s timeout, and caches successful
 * responses for 15 minutes. Failures are logged with `console.error` and never
 * expose Bókun credentials to the client.
 *
 * @param productId - Bókun activity id (e.g. `"1079932"`)
 * @param params.start - Range start `YYYY-MM-DD`
 * @param params.end - Range end `YYYY-MM-DD`
 * @param params.currency - ISO currency; defaults to `EUR`
 * @param params.lang - Bókun language code; defaults to `EN`
 * @param params.includeSoldOut - When false (default), sold-out slots may be omitted by Bókun
 */
export async function fetchAvailabilities(
  productId: string,
  params: Pick<BokunAvailabilitiesParams, "start" | "end"> &
    Partial<Pick<BokunAvailabilitiesParams, "lang" | "currency" | "includeSoldOut">>,
): Promise<FetchAvailabilitiesResult> {
  const trimmedId = productId.trim();
  if (!trimmedId) {
    return { success: false, error: "Invalid product id" };
  }

  const currency = params.currency ?? DEFAULT_CURRENCY;
  const cacheKey = buildAvailabilitiesCacheKey(
    trimmedId,
    params.start,
    params.end,
    currency,
  );

  const cached = availabilitiesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { success: true, data: cached.data };
  }

  const requestParams: BokunAvailabilitiesParams = {
    start: params.start,
    end: params.end,
    lang: params.lang ?? DEFAULT_LANG,
    currency,
    includeSoldOut: params.includeSoldOut ?? false,
  };

  const pathWithQuery = buildAvailabilitiesPath(trimmedId, requestParams);
  const url = createBokunUrl(pathWithQuery);
  const headers = generateBokunHeaders("GET", pathWithQuery);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[availabilities] request failed (${response.status}) for product ${trimmedId}`,
      );
      return { success: false, error: "Unable to load availabilities" };
    }

    const raw: unknown = await response.json();
    if (!Array.isArray(raw)) {
      console.error(
        `[availabilities] invalid response shape for product ${trimmedId}`,
      );
      return { success: false, error: "Unable to load availabilities" };
    }

    const data = raw.filter(isValidAvailabilityRow);
    if (data.length !== raw.length) {
      console.error(
        `[availabilities] dropped ${raw.length - data.length} invalid row(s) for product ${trimmedId}`,
      );
    }

    availabilitiesCache.set(cacheKey, { data, timestamp: Date.now() });
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[availabilities] request error for product ${trimmedId}: ${message}`,
    );
    return { success: false, error: "Unable to load availabilities" };
  } finally {
    clearTimeout(timeoutId);
  }
}
