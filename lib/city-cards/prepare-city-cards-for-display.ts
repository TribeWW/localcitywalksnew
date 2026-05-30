import type { CardListingReviewRatingsResult } from "@/lib/actions/reviews.actions";
import { mergePriceHeadlinesIntoCityCards } from "@/lib/bokun/merge-price-headlines-into-city-cards";
import { toBokunProductIdDigits } from "@/lib/utils/bokun-product-id";
import { resolveCityCardRatingDisplay } from "@/lib/utils/city-card-rating-display";
import type { CityCardData, ProductPriceHeadline } from "@/types/bokun";

/**
 * Server-side listing prep: merge enriched prices and rating display fields onto cards.
 */
export function prepareCityCardsForListingDisplay(
  cards: readonly CityCardData[],
  headlines: ReadonlyMap<string, ProductPriceHeadline>,
  ratings: CardListingReviewRatingsResult,
): CityCardData[] {
  const withPrices = mergePriceHeadlinesIntoCityCards(cards, headlines);

  return withPrices.map((card) => {
    const normalizedId =
      toBokunProductIdDigits(card.id) ?? String(card.id);
    const { ratingLabel, showRating } = resolveCityCardRatingDisplay(
      ratings.perTourMap.get(normalizedId),
      ratings.globalSummary,
    );

    return {
      ...card,
      ratingLabel,
      showRating,
    };
  });
}
