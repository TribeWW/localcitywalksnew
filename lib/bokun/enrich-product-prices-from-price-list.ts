import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { BOKUN_ENDPOINTS } from "@/lib/bokun/config";
import { extractHeadlineFromPriceList } from "@/lib/bokun/extract-price-list-headline";
import type { BokunPriceListResponse, ProductPriceHeadline } from "@/types/bokun";

const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_PRODUCT_IDS = 50;
const FETCH_CONCURRENCY = 6;
const DEFAULT_CURRENCY = "EUR";
const CATALOGUE_WINDOW_DAYS = 365;

const SAFE_ID_REGEX = /^[0-9]+$/;

const headlineCache = new Map<
  string,
  { headline: ProductPriceHeadline | null; timestamp: number }
>();

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shared catalogue window for stable cache keys across listing requests. */
export function getCataloguePriceListWindow(referenceDate = new Date()): {
  start: string;
  end: string;
  catalogueDate: string;
} {
  const startDate = new Date(referenceDate);
  const endDate = new Date(referenceDate);
  endDate.setUTCDate(endDate.getUTCDate() + CATALOGUE_WINDOW_DAYS);

  return {
    start: formatUtcDate(startDate),
    end: formatUtcDate(endDate),
    catalogueDate: formatUtcDate(startDate),
  };
}

function buildPriceListPath(
  productId: string,
  start: string,
  end: string,
  currency: string,
): string {
  const basePath = BOKUN_ENDPOINTS.PRICE_LIST(productId);
  const query = new URLSearchParams({
    currency,
    start,
    end,
  });
  return `${basePath}?${query.toString()}`;
}

function normalizeProductIds(productIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawId of productIds) {
    const digits = rawId.replace(/\D/g, "");
    if (!digits || !SAFE_ID_REGEX.test(digits) || seen.has(digits)) {
      continue;
    }

    seen.add(digits);
    normalized.push(digits);
    if (normalized.length >= MAX_PRODUCT_IDS) {
      break;
    }
  }

  return normalized;
}

function getCacheKey(
  productId: string,
  start: string,
  end: string,
  currency: string,
): string {
  return `bokun-price-list-headline-${productId}-${start}-${end}-${currency}`;
}

async function fetchPriceList(
  productId: string,
  start: string,
  end: string,
  currency: string,
): Promise<BokunPriceListResponse | null> {
  const pathWithQuery = buildPriceListPath(productId, start, end, currency);
  const url = createBokunUrl(BOKUN_ENDPOINTS.PRICE_LIST(productId), {
    currency,
    start,
    end,
  });
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
        `[price-list] request failed (${response.status}) for product ${productId}`,
      );
      return null;
    }

    return (await response.json()) as BokunPriceListResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[price-list] request error for product ${productId}: ${message}`,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveHeadlineForProduct(
  productId: string,
  start: string,
  end: string,
  catalogueDate: string,
  currency: string,
): Promise<ProductPriceHeadline | null> {
  const cacheKey = getCacheKey(productId, start, end, currency);
  const cached = headlineCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.headline;
  }

  const [detailResult, priceList] = await Promise.all([
    getTourDetailById(productId),
    fetchPriceList(productId, start, end, currency),
  ]);

  if (!priceList) {
    headlineCache.set(cacheKey, { headline: null, timestamp: Date.now() });
    return null;
  }

  const defaultRateId = detailResult.success
    ? detailResult.data?.defaultRateId
    : undefined;

  if (defaultRateId == null) {
    console.warn(
      `[price-list] missing defaultRateId on activity detail for product ${productId}`,
    );
    headlineCache.set(cacheKey, { headline: null, timestamp: Date.now() });
    return null;
  }

  const headline = extractHeadlineFromPriceList(
    priceList,
    defaultRateId,
    catalogueDate,
    productId,
  );

  headlineCache.set(cacheKey, { headline, timestamp: Date.now() });
  return headline;
}

/**
 * Enriches listing products with tier-aware per-person headline amounts from Bókun `price-list`.
 * Server-only: bounded concurrency, TTL cache, no search-price fallback.
 */
export async function enrichProductPricesFromPriceList(
  productIds: readonly string[],
): Promise<Map<string, ProductPriceHeadline>> {
  const { start, end, catalogueDate } = getCataloguePriceListWindow();
  const normalizedIds = normalizeProductIds(productIds);
  const headlines = new Map<string, ProductPriceHeadline>();

  for (let index = 0; index < normalizedIds.length; index += FETCH_CONCURRENCY) {
    const chunk = normalizedIds.slice(index, index + FETCH_CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (productId) => {
        const headline = await resolveHeadlineForProduct(
          productId,
          start,
          end,
          catalogueDate,
          DEFAULT_CURRENCY,
        );
        return { productId, headline };
      }),
    );

    for (const { productId, headline } of results) {
      if (headline) {
        headlines.set(productId, headline);
      }
    }
  }

  return headlines;
}
