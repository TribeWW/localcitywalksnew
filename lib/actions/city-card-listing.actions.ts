"use server";

import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import type { CityCardData } from "@/types/bokun";

/**
 * Server action: price-list headlines + bulk Sanity ratings for listing cards.
 */
export async function enrichCityCardsForListingAction(
  cards: CityCardData[],
): Promise<CityCardData[]> {
  return enrichCityCardsForListing(cards);
}
