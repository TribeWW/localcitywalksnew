import { getReviewRatingSummariesForTourIds } from "@/lib/actions/reviews.actions";
import { enrichProductPricesFromPriceList } from "@/lib/bokun/enrich-product-prices-from-price-list";
import { prepareCityCardsForListingDisplay } from "@/lib/city-cards/prepare-city-cards-for-display";
import type { CityCardData } from "@/types/bokun";

/**
 * Server-only listing enrichment for home/explore card grids.
 */
export async function enrichCityCardsForListing(
  cards: readonly CityCardData[],
): Promise<CityCardData[]> {
  if (cards.length === 0) {
    return [];
  }

  const productIds = cards.map((card) => card.id);
  const [headlines, ratings] = await Promise.all([
    enrichProductPricesFromPriceList(productIds),
    getReviewRatingSummariesForTourIds(productIds),
  ]);

  return prepareCityCardsForListingDisplay(cards, headlines, ratings);
}
