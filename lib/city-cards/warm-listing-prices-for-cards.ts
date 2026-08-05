import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import {
  collectDefaultRateIdsFromCards,
  enrichProductPricesFromPriceList,
} from "@/lib/bokun/enrich-product-prices-from-price-list";
import { mergePriceHeadlinesIntoCityCards } from "@/lib/bokun/merge-price-headlines-into-city-cards";
import { toBokunProductIdDigits } from "@/lib/utils/bokun-product-id";
import type { CityCardData, ProductPriceHeadline } from "@/types/bokun";

/** Matches price-list enrichment concurrency. */
const FETCH_CONCURRENCY = 6;

/**
 * Matches `MAX_PRODUCT_IDS` in `enrichProductPricesFromPriceList` so full-catalog
 * warm (cron / cold rebuild) is not silently truncated.
 */
const PRICE_LIST_BATCH_SIZE = 50;

/**
 * Resolves missing `defaultRateId` values via Bókun activity detail.
 *
 * Fetches in bounded concurrency (`FETCH_CONCURRENCY`). Cards that already have a
 * rate id are left unchanged. Does not mutate the input array or card objects.
 *
 * @param cards - Listing cards that may lack `defaultRateId` (e.g. search snapshot)
 * @returns New card array with resolved `defaultRateId` where detail succeeded
 */
async function resolveDefaultRateIdsOntoCards(
  cards: readonly CityCardData[],
): Promise<CityCardData[]> {
  const missingProductIds: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (card.defaultRateId != null) {
      continue;
    }

    const productId = toBokunProductIdDigits(card.id) ?? String(card.id);
    if (seen.has(productId)) {
      continue;
    }

    seen.add(productId);
    missingProductIds.push(productId);
  }

  if (missingProductIds.length === 0) {
    return cards.map((card) => card);
  }

  const resolvedRateIds = new Map<string, number>();

  for (
    let index = 0;
    index < missingProductIds.length;
    index += FETCH_CONCURRENCY
  ) {
    const chunk = missingProductIds.slice(index, index + FETCH_CONCURRENCY);
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
        resolvedRateIds.set(productId, defaultRateId);
      }
    }
  }

  return cards.map((card) => {
    if (card.defaultRateId != null) {
      return card;
    }

    const productId = toBokunProductIdDigits(card.id) ?? String(card.id);
    const defaultRateId = resolvedRateIds.get(productId);
    if (defaultRateId == null) {
      return card;
    }

    return { ...card, defaultRateId };
  });
}

/**
 * Warms listing cards with `defaultRateId` and price-list headlines for catalog
 * snapshot writes (daily cron / explore cold rebuild).
 *
 * Pipeline: resolve missing rate ids from activity detail → batch
 * `enrichProductPricesFromPriceList` (chunks of `PRICE_LIST_BATCH_SIZE`) → merge
 * `displayPricePerPerson` / `displayPriceCurrency` onto cards. Does not fetch
 * Sanity ratings; those stay live on the listing request path.
 *
 * @param cards - City cards from Bokun search / catalog mapping
 * @returns New cards with rate ids and price headlines where enrichment succeeded
 */
export async function warmListingPricesForCards(
  cards: readonly CityCardData[],
): Promise<CityCardData[]> {
  if (cards.length === 0) {
    return [];
  }

  const cardsWithRateIds = await resolveDefaultRateIdsOntoCards(cards);
  const rateIdsByProductId = collectDefaultRateIdsFromCards(cardsWithRateIds);
  const productIds = cardsWithRateIds.map((card) => card.id);
  const headlines = new Map<string, ProductPriceHeadline>();

  for (
    let index = 0;
    index < productIds.length;
    index += PRICE_LIST_BATCH_SIZE
  ) {
    const chunk = productIds.slice(index, index + PRICE_LIST_BATCH_SIZE);
    const chunkHeadlines = await enrichProductPricesFromPriceList(
      chunk,
      rateIdsByProductId,
    );

    for (const [productId, headline] of chunkHeadlines) {
      headlines.set(productId, headline);
    }
  }

  return mergePriceHeadlinesIntoCityCards(cardsWithRateIds, headlines);
}
