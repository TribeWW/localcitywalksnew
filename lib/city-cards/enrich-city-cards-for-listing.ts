import { getReviewRatingSummariesForTourIds } from "@/lib/actions/reviews.actions";
import {
  collectDefaultRateIdsFromCards,
  enrichProductPricesFromPriceList,
} from "@/lib/bokun/enrich-product-prices-from-price-list";
import { prepareCityCardsForListingDisplay } from "@/lib/city-cards/prepare-city-cards-for-display";
import type { CityCardData, ProductPriceHeadline } from "@/types/bokun";

/**
 * Server-only listing enrichment for home/explore card grids.
 *
 * Cards that already carry `displayPricePerPerson` (warm Redis snapshot) skip
 * Bokun price-list. Ratings always load from Sanity in parallel.
 *
 * @param cards - Listing cards from catalog snapshot or live Bokun mapping
 * @returns Cards with price headlines (when needed) and rating display fields
 */
export async function enrichCityCardsForListing(
  cards: readonly CityCardData[],
): Promise<CityCardData[]> {
  if (cards.length === 0) {
    return [];
  }

  const productIds = cards.map((card) => card.id);
  const cardsNeedingPrices = cards.filter(
    (card) => card.displayPricePerPerson == null,
  );

  const [headlines, ratings] = await Promise.all([
    cardsNeedingPrices.length > 0
      ? enrichProductPricesFromPriceList(
          cardsNeedingPrices.map((card) => card.id),
          collectDefaultRateIdsFromCards(cardsNeedingPrices),
        )
      : Promise.resolve(new Map<string, ProductPriceHeadline>()),
    getReviewRatingSummariesForTourIds(productIds),
  ]);

  return prepareCityCardsForListingDisplay(cards, headlines, ratings);
}
