import { enrichCityCardsForListingAction } from "@/lib/actions/city-card-listing.actions";
import type { CityCardData } from "@/types/bokun";

/**
 * Client-side helper: enrich listing cards via server action when the flag is on.
 */
export async function enrichListingCardsIfFlagged(
  cards: CityCardData[],
  cardsWidgetUpdate: boolean,
): Promise<CityCardData[]> {
  if (!cardsWidgetUpdate || cards.length === 0) {
    return cards;
  }

  return enrichCityCardsForListingAction(cards);
}
