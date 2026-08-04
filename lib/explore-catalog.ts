import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";
import { transformSearchProductToCityCard } from "@/lib/bokun/transform-search-product-to-city-card";
import {
  readExploreCatalogSnapshot,
  writeExploreCatalogSnapshot,
} from "@/lib/explore/explore-catalog-store";
import { CityCardData, GetProductsPageResult } from "@/types/bokun";

/** Client-facing explore listing page size (unchanged UX). */
const EXPLORE_PAGE_SIZE = 20;

const CACHE_TTL = 15 * 60 * 1000;

type ExploreSnapshotBuildResult =
  | { ok: true; cards: CityCardData[] }
  | { ok: false; error: string };

type ExploreSortedBuildResult =
  | { ok: true; sorted: CityCardData[]; all: CityCardData[] }
  | { ok: false; error: string };

/** Process-local L1 cache of the full catalog snapshot (sorted A→Z). */
let exploreSnapshotCache: { cards: CityCardData[]; timestamp: number } | null =
  null;

/** One shared Promise while a cold snapshot build runs (dedupes concurrent misses). */
let inFlightSnapshotBuild: Promise<ExploreSnapshotBuildResult> | null = null;

/**
 * Clears the L1 snapshot cache — used by unit tests.
 */
export function resetExploreCatalogCacheForTests(): void {
  exploreSnapshotCache = null;
  inFlightSnapshotBuild = null;
}

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

function sortByTitleAsc(cards: CityCardData[]): CityCardData[] {
  return [...cards].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
}

function normalizeCountryCodes(
  countryCodes: string[] | null | undefined,
): string[] {
  return (countryCodes ?? [])
    .map((code) => code.trim())
    .filter(Boolean)
    .sort();
}

/**
 * Filters a full A→Z snapshot by country and optionally reverses for Z→A.
 *
 * Filtering an already-sorted list preserves alphabetical order.
 */
function filterAndApplySortDirection(
  cards: CityCardData[],
  countryCodes: string[] | null | undefined,
  sortAscending: boolean,
): CityCardData[] {
  const normalizedCountryCodes = normalizeCountryCodes(countryCodes);
  let filtered = cards;

  if (normalizedCountryCodes.length > 0) {
    const allowed = new Set(normalizedCountryCodes);
    filtered = cards.filter((card) => {
      const code = card.countryCode?.trim();
      return Boolean(code && allowed.has(code));
    });
  }

  return sortAscending ? filtered : [...filtered].reverse();
}

/**
 * Loads the full explore catalog snapshot: L1 → Redis → Bokun rebuild on miss.
 *
 * On a Bokun rebuild, best-effort writes Redis so subsequent cold instances hit
 * the durable snapshot. Cards are stored sorted A→Z.
 */
async function getOrBuildExploreCatalogSnapshot(): Promise<ExploreSnapshotBuildResult> {
  if (
    exploreSnapshotCache &&
    Date.now() - exploreSnapshotCache.timestamp < CACHE_TTL
  ) {
    return { ok: true, cards: exploreSnapshotCache.cards };
  }

  if (inFlightSnapshotBuild) {
    return inFlightSnapshotBuild;
  }

  const buildPromise = (async (): Promise<ExploreSnapshotBuildResult> => {
    try {
      const snapshot = await readExploreCatalogSnapshot();
      if (snapshot && snapshot.length > 0) {
        const cards = sortByTitleAsc(snapshot);
        exploreSnapshotCache = { cards, timestamp: Date.now() };
        return { ok: true, cards };
      }

      const catalog = await fetchAllBokunSearchProducts();
      if (!catalog.ok) {
        return { ok: false, error: catalog.error };
      }

      const cards = sortByTitleAsc(
        catalog.products.map(transformSearchProductToCityCard),
      );

      await writeExploreCatalogSnapshot(cards);

      exploreSnapshotCache = { cards, timestamp: Date.now() };
      return { ok: true, cards };
    } finally {
      inFlightSnapshotBuild = null;
    }
  })();

  inFlightSnapshotBuild = buildPromise;
  return buildPromise;
}

/**
 * Provide a deduplicated, alphabetically sorted array of CityCardData for the
 * given country filter and sort direction, using the durable snapshot (L1 /
 * Redis) and rebuilding from Bokun only on miss.
 *
 * @param countryCodes - Optional ISO country codes to filter; empty/null = all
 * @param sortAscending - `true` for A→Z, `false` for Z→A
 */
async function getOrBuildExploreSortedList(
  countryCodes: string[] | null | undefined,
  sortAscending: boolean,
): Promise<ExploreSortedBuildResult> {
  const built = await getOrBuildExploreCatalogSnapshot();
  if (!built.ok) {
    return built;
  }

  return {
    ok: true,
    all: built.cards,
    sorted: filterAndApplySortDirection(
      built.cards,
      countryCodes,
      sortAscending,
    ),
  };
}

/**
 * Produce a paginated slice of the explore catalog filtered by country and sort direction.
 *
 * Serves from the Redis/L1 snapshot when available; country filter and sort are
 * applied in memory. `completeCountryList` is derived from the full snapshot.
 *
 * @param page - 1-based page number (values less than 1 are normalized to 1)
 * @param countryCodes - ISO country codes to filter; empty/null = all countries
 * @param sortAscending - `true` to sort titles ascending, `false` for descending
 */
export async function getExploreCatalogPage(
  page: number,
  countryCodes: string[] | null | undefined,
  sortAscending: boolean,
): Promise<GetProductsPageResult> {
  const pageNum = Math.max(1, Math.floor(page));
  try {
    const built = await getOrBuildExploreSortedList(countryCodes, sortAscending);
    if (!built.ok) {
      return { success: false, error: built.error };
    }
    const { sorted, all } = built;
    const totalHits = sorted.length;
    const start = (pageNum - 1) * EXPLORE_PAGE_SIZE;
    const data = sorted.slice(start, start + EXPLORE_PAGE_SIZE);
    return {
      success: true,
      data,
      totalHits,
      completeCountryList: buildCompleteCountryList(all),
    };
  } catch (error) {
    console.error("Error building explore catalog page:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Returns the full deduplicated explore catalog for structured data (ItemList JSON-LD).
 *
 * Unlike {@link getExploreCatalogPage}, this returns every tour row — not a single page slice.
 */
export async function getExploreCatalogForStructuredData(): Promise<
  | { success: true; items: CityCardData[] }
  | { success: false; error: string }
> {
  try {
    const built = await getOrBuildExploreSortedList(null, true);
    if (!built.ok) {
      return { success: false, error: built.error };
    }
    return { success: true, items: built.sorted };
  } catch (error) {
    console.error("Error building explore catalog for structured data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
