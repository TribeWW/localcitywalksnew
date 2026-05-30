import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { BOKUN_ENDPOINTS } from "@/lib/bokun/config";
import { extractHeadlineFromPriceList } from "@/lib/bokun/extract-price-list-headline";
import {
  normalizeBokunProductIds,
  toBokunProductIdDigits,
} from "@/lib/utils/bokun-product-id";
import type {
  BokunPriceListResponse,
  CityCardData,
  ProductPriceHeadline,
} from "@/types/bokun";

const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_PRODUCT_IDS = 50;
const MAX_HEADLINE_CACHE_ENTRIES = MAX_PRODUCT_IDS * 4;
const FETCH_CONCURRENCY = 6;
const DEFAULT_CURRENCY = "EUR";
const CATALOGUE_WINDOW_DAYS = 365;

const headlineCache = new Map<
  string,
  { headline: ProductPriceHeadline | null; timestamp: number }
>();

type HeadlineCacheEntry = {
  headline: ProductPriceHeadline | null;
  timestamp: number;
};

function isHeadlineCacheEntryFresh(
  entry: HeadlineCacheEntry,
  now = Date.now(),
): boolean {
  return now - entry.timestamp < CACHE_TTL_MS;
}

function pruneExpiredHeadlineCache(now = Date.now()): void {
  for (const [key, entry] of headlineCache) {
    if (!isHeadlineCacheEntryFresh(entry, now)) {
      headlineCache.delete(key);
    }
  }
}

function trimHeadlineCacheToMaxSize(): void {
  if (headlineCache.size <= MAX_HEADLINE_CACHE_ENTRIES) {
    return;
  }

  const oldestFirst = [...headlineCache.entries()].sort(
    (left, right) => left[1].timestamp - right[1].timestamp,
  );
  const excess = headlineCache.size - MAX_HEADLINE_CACHE_ENTRIES;

  for (let index = 0; index < excess; index++) {
    headlineCache.delete(oldestFirst[index]![0]);
  }
}

function readHeadlineCache(
  cacheKey: string,
): ProductPriceHeadline | null | undefined {
  const cached = headlineCache.get(cacheKey);
  if (!cached) {
    return undefined;
  }

  if (!isHeadlineCacheEntryFresh(cached)) {
    headlineCache.delete(cacheKey);
    return undefined;
  }

  return cached.headline;
}

function writeHeadlineCache(
  cacheKey: string,
  headline: ProductPriceHeadline | null,
): void {
  pruneExpiredHeadlineCache();
  headlineCache.set(cacheKey, { headline, timestamp: Date.now() });
  trimHeadlineCacheToMaxSize();
}

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

/** Builds a product-id map from listing cards that already resolved activity detail. */
export function collectDefaultRateIdsFromCards(
  cards: readonly Pick<CityCardData, "id" | "defaultRateId">[],
): Map<string, number> {
  const rateIds = new Map<string, number>();

  for (const card of cards) {
    if (card.defaultRateId == null) {
      continue;
    }

    const productId = toBokunProductIdDigits(card.id) ?? String(card.id);
    rateIds.set(productId, card.defaultRateId);
  }

  return rateIds;
}

function buildPriceListQuery({
  currency,
  start,
  end,
}: {
  currency: string;
  start: string;
  end: string;
}): string {
  return new URLSearchParams({ currency, start, end }).toString();
}

function buildPriceListPath(
  productId: string,
  currency: string,
  start: string,
  end: string,
): string {
  const basePath = BOKUN_ENDPOINTS.PRICE_LIST(productId);
  return `${basePath}?${buildPriceListQuery({ currency, start, end })}`;
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
  const pathWithQuery = buildPriceListPath(productId, currency, start, end);
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

async function prefetchDefaultRateIdsByProductId(
  productIds: readonly string[],
  seed: ReadonlyMap<string, number>,
): Promise<Map<string, number>> {
  const rateIds = new Map<string, number>(seed);
  const missing = productIds.filter((productId) => !rateIds.has(productId));

  for (let index = 0; index < missing.length; index += FETCH_CONCURRENCY) {
    const chunk = missing.slice(index, index + FETCH_CONCURRENCY);
    const details = await Promise.all(
      chunk.map((productId) => getTourDetailById(productId)),
    );

    for (let i = 0; i < chunk.length; i++) {
      const productId = chunk[i]!;
      const detail = details[i];
      const defaultRateId = detail?.success
        ? detail.data?.defaultRateId
        : undefined;

      if (defaultRateId != null) {
        rateIds.set(productId, defaultRateId);
      }
    }
  }

  return rateIds;
}

async function resolveHeadlineForProduct(
  productId: string,
  start: string,
  end: string,
  catalogueDate: string,
  currency: string,
  defaultRateId?: number,
): Promise<ProductPriceHeadline | null> {
  const cacheKey = getCacheKey(productId, start, end, currency);
  const cachedHeadline = readHeadlineCache(cacheKey);
  if (cachedHeadline !== undefined) {
    return cachedHeadline;
  }

  const priceList = await fetchPriceList(productId, start, end, currency);

  if (!priceList) {
    writeHeadlineCache(cacheKey, null);
    return null;
  }

  if (defaultRateId == null) {
    console.warn(
      `[price-list] missing defaultRateId on activity detail for product ${productId}`,
    );
    writeHeadlineCache(cacheKey, null);
    return null;
  }

  const headline = extractHeadlineFromPriceList(
    priceList,
    defaultRateId,
    catalogueDate,
    productId,
  );

  writeHeadlineCache(cacheKey, headline);
  return headline;
}

/**
 * Enriches listing products with tier-aware per-person headline amounts from Bókun `price-list`.
 * Server-only: bounded concurrency, TTL cache, no search-price fallback.
 */
export async function enrichProductPricesFromPriceList(
  productIds: readonly unknown[],
  defaultRateIdsByProductId: ReadonlyMap<string, number> = new Map(),
): Promise<Map<string, ProductPriceHeadline>> {
  const { start, end, catalogueDate } = getCataloguePriceListWindow();
  const normalizedIds = normalizeBokunProductIds(productIds, MAX_PRODUCT_IDS);
  const headlines = new Map<string, ProductPriceHeadline>();

  if (normalizedIds.length === 0) {
    return headlines;
  }

  const defaultRateIds = await prefetchDefaultRateIdsByProductId(
    normalizedIds,
    defaultRateIdsByProductId,
  );

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
          defaultRateIds.get(productId),
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
