/**
 * Process-local TTL cache for Bokun tour detail payloads.
 */

import type { BokunProductDetail } from "@/types/bokun";

type DetailCacheEntry = {
  data: BokunProductDetail;
  timestamp: number;
};

const detailCache = new Map<string, DetailCacheEntry>();

/** 15-minute TTL aligned with listing product caches. */
export const DETAIL_CACHE_TTL_MS = 15 * 60 * 1000;

/** Cap process-wide detail payloads so unique ids cannot grow without bound. */
export const MAX_DETAIL_CACHE_ENTRIES = 100;

function isDetailCacheEntryFresh(
  entry: DetailCacheEntry,
  now = Date.now(),
): boolean {
  return now - entry.timestamp < DETAIL_CACHE_TTL_MS;
}

function pruneExpiredDetailCache(now = Date.now()): void {
  for (const [key, entry] of detailCache) {
    if (!isDetailCacheEntryFresh(entry, now)) {
      detailCache.delete(key);
    }
  }
}

function trimDetailCacheToMaxSize(): void {
  if (detailCache.size <= MAX_DETAIL_CACHE_ENTRIES) {
    return;
  }

  const oldestFirst = [...detailCache.entries()].sort(
    (left, right) => left[1].timestamp - right[1].timestamp,
  );
  const excess = detailCache.size - MAX_DETAIL_CACHE_ENTRIES;

  for (let index = 0; index < excess; index++) {
    detailCache.delete(oldestFirst[index]![0]);
  }
}

/** Returns fresh cached detail for `cacheKey`, deleting stale entries. */
export function readDetailCache(
  cacheKey: string,
): BokunProductDetail | undefined {
  const cached = detailCache.get(cacheKey);
  if (!cached) {
    return undefined;
  }

  if (!isDetailCacheEntryFresh(cached)) {
    detailCache.delete(cacheKey);
    return undefined;
  }

  return cached.data;
}

/**
 * Inserts a detail payload after pruning expired entries, then enforces the
 * maximum cache size (oldest-first eviction).
 */
export function writeDetailCache(
  cacheKey: string,
  data: BokunProductDetail,
): void {
  pruneExpiredDetailCache();
  detailCache.set(cacheKey, { data, timestamp: Date.now() });
  trimDetailCacheToMaxSize();
}

/** Test-only: current process-local detail cache size. */
export function getDetailCacheSizeForTests(): number {
  return detailCache.size;
}

/** Test-only: clear the process-local detail cache. */
export function resetDetailCacheForTests(): void {
  detailCache.clear();
}
