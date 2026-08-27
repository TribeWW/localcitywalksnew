import { toBokunProductIdDigits } from "@/lib/bokun/bokun-product-id";
import type { CityCardData } from "@/types/bokun";

/** Deepest waterfall tier entered while still short of `max` cards. */
export type RelatedToursDeepestTier = 1 | 2 | 3 | 4;

/**
 * Inputs for the pure related-tours picker. `catalog` must already be A→Z by
 * `title` (explore snapshot order). `spotlightIds` stay in editorial 1–8 order.
 */
export type SelectRelatedToursInput = {
  currentProductId: string;
  citySlug: string;
  countryCode: string | null | undefined;
  hasRegion: boolean;
  regionCitySlugs: readonly string[];
  catalog: readonly CityCardData[];
  spotlightIds: readonly string[];
  regionName: string | null | undefined;
  countryName: string | null | undefined;
  /** Max cards to return; defaults to 4. */
  max?: number;
};

/**
 * Result of related-tour selection. `null` from {@link selectRelatedTours} means
 * hide the section (zero other products).
 */
export type SelectRelatedToursResult = {
  cards: CityCardData[];
  heading: string;
  deepestTier: RelatedToursDeepestTier;
};

/**
 * Builds the section heading from the deepest tier entered and geography labels.
 *
 * - No usable region name + non-empty country → `Explore more of [Country]`
 *   (overrides deepest tier; used when `hasRegion` is false or region name blank).
 * - Deepest 1 or 2 → `Explore more of [Region]`
 * - Deepest 3 → `Explore [Region] and more of [Country]`
 * - Deepest 4 or no usable country → `Popular with other travellers`
 */
export function buildRelatedToursHeading(input: {
  deepestTier: RelatedToursDeepestTier;
  hasRegion: boolean;
  regionName: string | null | undefined;
  countryName: string | null | undefined;
}): string {
  const country = trimLabel(input.countryName);
  const region = trimLabel(input.regionName);
  const treatAsNoRegion = !input.hasRegion || !region;

  if (treatAsNoRegion && country) {
    return `Explore more of ${country}`;
  }

  if (input.deepestTier === 1 || input.deepestTier === 2) {
    return `Explore more of ${region}`;
  }

  if (input.deepestTier === 3 && region && country) {
    return `Explore ${region} and more of ${country}`;
  }

  return "Popular with other travellers";
}

/**
 * Pure four-tier related-tour picker: same city → same region → same country →
 * Home Spotlight. Never includes the current product or duplicates. Each round
 * scans its list from index 0. Blank `countryCode` skips tiers 1–3 (spotlight only).
 *
 * @returns Up to `max` cards with heading and deepest tier, or `null` if none.
 */
export function selectRelatedTours(
  input: SelectRelatedToursInput,
): SelectRelatedToursResult | null {
  const max = input.max ?? 4;
  const currentDigits = toBokunProductIdDigits(input.currentProductId);
  const countryCode = normalizeCountryCode(input.countryCode);
  const regionSlugSet = new Set(input.regionCitySlugs);
  const catalogById = buildCatalogIdMap(input.catalog);

  const picked: CityCardData[] = [];
  const pickedDigits = new Set<string>();
  let deepestTier: RelatedToursDeepestTier | null = null;

  const tryPick = (card: CityCardData): boolean => {
    const digits = toBokunProductIdDigits(card.id);
    if (!digits || digits === currentDigits || pickedDigits.has(digits)) {
      return false;
    }
    picked.push(card);
    pickedDigits.add(digits);
    return true;
  };

  const enterTier = countryCode != null;

  if (enterTier) {
    // Tier 1 — same city
    if (picked.length < max) {
      deepestTier = 1;
      for (const c of input.catalog) {
        if (picked.length >= max) break;
        if (c.citySlug === input.citySlug) {
          tryPick(c);
        }
      }
    }

    // Tier 2 — same region (skipped when no region)
    if (picked.length < max && input.hasRegion) {
      deepestTier = 2;
      for (const c of input.catalog) {
        if (picked.length >= max) break;
        if (c.citySlug && regionSlugSet.has(c.citySlug)) {
          tryPick(c);
        }
      }
    }

    // Tier 3 — same country (A→Z via catalog order)
    if (picked.length < max) {
      deepestTier = 3;
      for (const c of input.catalog) {
        if (picked.length >= max) break;
        if (normalizeCountryCode(c.countryCode) === countryCode) {
          tryPick(c);
        }
      }
    }
  }

  // Tier 4 — Home Spotlight (editorial order)
  if (picked.length < max) {
    deepestTier = 4;
    for (const rawId of input.spotlightIds) {
      if (picked.length >= max) break;
      const digits = toBokunProductIdDigits(rawId);
      if (!digits) continue;
      const card = catalogById.get(digits);
      if (card) {
        tryPick(card);
      }
    }
  }

  if (picked.length === 0 || deepestTier == null) {
    return null;
  }

  return {
    cards: picked,
    deepestTier,
    heading: buildRelatedToursHeading({
      deepestTier,
      hasRegion: input.hasRegion,
      regionName: input.regionName,
      countryName: input.countryName,
    }),
  };
}

/**
 * Trims a display label; empty after trim → `null`.
 */
function trimLabel(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalizes ISO2 country codes for comparison (trim + upper). Blank → `null`.
 */
function normalizeCountryCode(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

/**
 * Maps digit-normalized product ids → catalog cards for spotlight resolution.
 */
function buildCatalogIdMap(
  catalog: readonly CityCardData[],
): Map<string, CityCardData> {
  const map = new Map<string, CityCardData>();
  for (const c of catalog) {
    const digits = toBokunProductIdDigits(c.id);
    if (digits && !map.has(digits)) {
      map.set(digits, c);
    }
  }
  return map;
}
