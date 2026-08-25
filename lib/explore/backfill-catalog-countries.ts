/**
 * backfill-catalog-countries — preview/staging helper to fill missing ISO2
 * country fields from Bókun activity detail (`googlePlace`).
 *
 * Search payloads on bokuntest often omit `googlePlace`, so the explore picker
 * would otherwise be empty. Production must not call this: Redis snapshots stay
 * search-shaped and this helper never writes KV.
 */

import { toBokunProductIdDigits } from "@/lib/bokun/bokun-product-id";
import { getTourDetailById } from "@/lib/tours/detail.actions";
import type { BokunGooglePlace, CityCardData } from "@/types/bokun";

/** Same bounded concurrency as listing price warming. */
const FETCH_CONCURRENCY = 6;

const ISO2_REGEX = /^[A-Z]{2}$/;

/**
 * Returns whether a listing card is missing a usable ISO2 country code.
 *
 * Empty, whitespace, and non-ISO2 values (e.g. `"PRT"`, `"Unknown"`) need
 * backfill. Valid two-letter codes are accepted case-insensitively.
 *
 * @param card - Catalog card from search mapping
 */
export function cardNeedsCountryBackfill(card: CityCardData): boolean {
  const code = card.countryCode?.trim().toUpperCase();
  return !code || !ISO2_REGEX.test(code);
}

/**
 * Parses a Bókun `googlePlace` into catalog country fields.
 *
 * @param googlePlace - Activity-detail location, if present
 * @returns ISO2 + display name, or `null` when the code is missing/invalid
 */
export function countryFromGooglePlace(
  googlePlace: Pick<BokunGooglePlace, "countryCode" | "country"> | undefined,
): { countryCode: string; country: string } | null {
  const countryCode = googlePlace?.countryCode?.trim().toUpperCase();
  if (!countryCode || !ISO2_REGEX.test(countryCode)) {
    return null;
  }

  const country = googlePlace?.country?.trim() || "Unknown";
  return { countryCode, country };
}

/**
 * Copies country fields from activity detail onto a card that lacks a usable ISO2.
 *
 * Existing valid ISO2 codes are never overwritten. `country` is set when blank or
 * `"Unknown"`.
 *
 * @param card - Listing card that may lack country fields
 * @param googlePlace - Location from activity detail
 * @returns Original card, or a new card with backfilled country fields
 */
export function mergeBackfilledCountry(
  card: CityCardData,
  googlePlace: Pick<BokunGooglePlace, "countryCode" | "country"> | undefined,
): CityCardData {
  if (!cardNeedsCountryBackfill(card)) {
    return card;
  }

  const parsed = countryFromGooglePlace(googlePlace);
  if (!parsed) {
    return card;
  }

  const currentLabel = card.country?.trim();
  const shouldReplaceLabel =
    !currentLabel || currentLabel === "Unknown";

  return {
    ...card,
    countryCode: parsed.countryCode,
    ...(shouldReplaceLabel ? { country: parsed.country } : {}),
  };
}

/**
 * Fills missing `countryCode` / `country` from activity detail for cards that
 * lack ISO2 after search mapping.
 *
 * Fetches only ids that need a backfill (bounded concurrency). Failed detail
 * lookups leave those cards unchanged. Does not mutate the input array.
 *
 * @param cards - Mapped (and typically price-warmed) catalog cards
 * @returns New array with country fields filled where detail succeeded
 */
export async function backfillMissingCatalogCountries(
  cards: readonly CityCardData[],
): Promise<CityCardData[]> {
  if (cards.length === 0) {
    return [];
  }

  const productIdsToFetch: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (!cardNeedsCountryBackfill(card)) {
      continue;
    }

    const productId = toBokunProductIdDigits(card.id) ?? String(card.id);
    if (!productId || seen.has(productId)) {
      continue;
    }

    seen.add(productId);
    productIdsToFetch.push(productId);
  }

  if (productIdsToFetch.length === 0) {
    return cards.map((card) => card);
  }

  const googlePlaceByProductId = new Map<
    string,
    Pick<BokunGooglePlace, "countryCode" | "country">
  >();

  for (
    let index = 0;
    index < productIdsToFetch.length;
    index += FETCH_CONCURRENCY
  ) {
    const chunk = productIdsToFetch.slice(index, index + FETCH_CONCURRENCY);
    const details = await Promise.all(
      chunk.map((productId) => getTourDetailById(productId)),
    );

    for (let i = 0; i < chunk.length; i++) {
      const productId = chunk[i]!;
      const detail = details[i];
      const googlePlace = detail?.success
        ? detail.data?.googlePlace
        : undefined;
      if (!googlePlace) {
        continue;
      }

      googlePlaceByProductId.set(productId, googlePlace);
    }
  }

  return cards.map((card) => {
    const productId = toBokunProductIdDigits(card.id) ?? String(card.id);
    return mergeBackfilledCountry(card, googlePlaceByProductId.get(productId));
  });
}
