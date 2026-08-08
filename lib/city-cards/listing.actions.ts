"use server";

import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import { parseCityCardListingInput } from "@/lib/validation/city-card-listing";
import type { CityCardData } from "@/types/bokun";

const MAX_LISTING_ENRICHMENT_CARDS = 100;

/**
 * Validates listing cards from the client and returns clean {@link CityCardData}
 * objects built from a complete runtime schema (unknown keys stripped).
 */
function parseCityCardListingCards(cards: unknown): CityCardData[] {
  if (!Array.isArray(cards)) {
    throw new Error("Invalid listing cards: expected an array");
  }

  if (cards.length === 0) {
    throw new Error("Invalid listing cards: empty array");
  }

  if (cards.length > MAX_LISTING_ENRICHMENT_CARDS) {
    throw new Error(
      `Invalid listing cards: at most ${MAX_LISTING_ENRICHMENT_CARDS} cards allowed`,
    );
  }

  return cards.map((card, index) => parseCityCardListingInput(card, index));
}

/**
 * Server action: price-list headlines + bulk Sanity ratings for listing cards.
 */
export async function enrichCityCardsForListingAction(
  cards: CityCardData[],
): Promise<CityCardData[]> {
  const validatedCards = parseCityCardListingCards(cards);
  return enrichCityCardsForListing(validatedCards);
}
