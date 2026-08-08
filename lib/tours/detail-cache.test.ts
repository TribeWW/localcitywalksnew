/**
 * detail-cache — TTL prune and max-size eviction for tour detail payloads.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DETAIL_CACHE_TTL_MS,
  MAX_DETAIL_CACHE_ENTRIES,
  getDetailCacheSizeForTests,
  readDetailCache,
  resetDetailCacheForTests,
  writeDetailCache,
} from "@/lib/tours/detail-cache";
import type { BokunProductDetail } from "@/types/bokun";

function detail(id: string): BokunProductDetail {
  return { id, title: `Tour ${id}` } as BokunProductDetail;
}

describe("detail-cache", () => {
  beforeEach(() => {
    resetDetailCacheForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    resetDetailCacheForTests();
    vi.useRealTimers();
  });

  it("returns cached detail within TTL", () => {
    writeDetailCache("bokun-tour-1", detail("1"));
    expect(readDetailCache("bokun-tour-1")?.id).toBe("1");
  });

  it("deletes and misses stale entries on read", () => {
    writeDetailCache("bokun-tour-1", detail("1"));
    vi.advanceTimersByTime(DETAIL_CACHE_TTL_MS + 1);
    expect(readDetailCache("bokun-tour-1")).toBeUndefined();
    expect(getDetailCacheSizeForTests()).toBe(0);
  });

  it("prunes expired entries before insert", () => {
    writeDetailCache("bokun-tour-old", detail("old"));
    vi.advanceTimersByTime(DETAIL_CACHE_TTL_MS + 1);
    writeDetailCache("bokun-tour-new", detail("new"));
    expect(readDetailCache("bokun-tour-old")).toBeUndefined();
    expect(readDetailCache("bokun-tour-new")?.id).toBe("new");
    expect(getDetailCacheSizeForTests()).toBe(1);
  });

  it("evicts oldest entries when exceeding max size", () => {
    for (let index = 0; index < MAX_DETAIL_CACHE_ENTRIES; index++) {
      vi.advanceTimersByTime(1);
      writeDetailCache(`bokun-tour-${index}`, detail(String(index)));
    }

    expect(getDetailCacheSizeForTests()).toBe(MAX_DETAIL_CACHE_ENTRIES);

    vi.advanceTimersByTime(1);
    writeDetailCache("bokun-tour-newest", detail("newest"));

    expect(getDetailCacheSizeForTests()).toBe(MAX_DETAIL_CACHE_ENTRIES);
    expect(readDetailCache("bokun-tour-0")).toBeUndefined();
    expect(readDetailCache("bokun-tour-newest")?.id).toBe("newest");
  });
});
