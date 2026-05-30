"use server";

import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import type { CityCardData } from "@/types/bokun";

const MAX_LISTING_ENRICHMENT_CARDS = 100;

function assertValidCityCardListingInput(
  cards: unknown,
): asserts cards is CityCardData[] {
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

  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    if (!card || typeof card !== "object") {
      throw new Error(`Invalid listing card at index ${index}`);
    }

    const { id, title, image } = card as CityCardData;

    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`Invalid listing card id at index ${index}`);
    }

    if (typeof title !== "string" || !title.trim()) {
      throw new Error(`Invalid listing card title at index ${index}`);
    }

    if (typeof image !== "string" || !image.trim()) {
      throw new Error(`Invalid listing card image at index ${index}`);
    }
  }
}

/**
 * Server action: price-list headlines + bulk Sanity ratings for listing cards.
 */
export async function enrichCityCardsForListingAction(
  cards: CityCardData[],
): Promise<CityCardData[]> {
  assertValidCityCardListingInput(cards);
  return enrichCityCardsForListing(cards);
}
