import type { CityCardData, ProductPriceHeadline } from "@/types/bokun";

/**
 * Merges `price-list` headline values onto listing cards by Bókun product id.
 */
export function mergePriceHeadlinesIntoCityCards(
  cards: readonly CityCardData[],
  headlines: ReadonlyMap<string, ProductPriceHeadline>,
): CityCardData[] {
  return cards.map((card) => {
    const headline = headlines.get(card.id);
    if (!headline) {
      return card;
    }

    return {
      ...card,
      displayPricePerPerson: headline.amount,
      displayPriceCurrency: headline.currency,
    };
  });
}
