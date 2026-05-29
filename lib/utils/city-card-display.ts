import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import type { CityCardData } from "@/types/bokun";

type CityCardDisplayFields = Pick<
  CityCardData,
  "title" | "displayPricePerPerson" | "displayPriceCurrency" | "showRating" | "ratingLabel"
>;

export function getCityCardTitle(
  cityTitle: string,
  cardsWidgetUpdate: boolean,
): string {
  if (cardsWidgetUpdate) {
    return `Hello ${cityTitle}`;
  }

  return cityTitle;
}

export function getCityCardPriceLine(
  city: Pick<CityCardData, "displayPricePerPerson" | "displayPriceCurrency">,
  cardsWidgetUpdate: boolean,
): string | null {
  return getCityCardPriceAmount(city, cardsWidgetUpdate);
}

/** Formatted currency amount for the minimal card price row (e.g. `€124`). */
export function getCityCardPriceAmount(
  city: Pick<CityCardData, "displayPricePerPerson" | "displayPriceCurrency">,
  cardsWidgetUpdate: boolean,
): string | null {
  if (!cardsWidgetUpdate) {
    return null;
  }

  if (city.displayPricePerPerson == null) {
    return null;
  }

  const currency = city.displayPriceCurrency?.trim() || "EUR";

  return formatCataloguePriceAmount(
    city.displayPricePerPerson,
    currency,
  );
}

export function getCityCardRatingLine(
  city: Pick<CityCardData, "showRating" | "ratingLabel">,
  cardsWidgetUpdate: boolean,
): string | null {
  if (!cardsWidgetUpdate || !city.showRating || !city.ratingLabel) {
    return null;
  }

  return city.ratingLabel;
}

export function getCityCardSubtitle(cardsWidgetUpdate: boolean): string | null {
  if (cardsWidgetUpdate) {
    return null;
  }

  return "Private tour";
}

export function getCityCardDisplayContent(
  city: CityCardDisplayFields,
  cardsWidgetUpdate: boolean,
) {
  return {
    title: getCityCardTitle(city.title, cardsWidgetUpdate),
    priceAmount: getCityCardPriceAmount(city, cardsWidgetUpdate),
    priceLine: getCityCardPriceLine(city, cardsWidgetUpdate),
    ratingLine: getCityCardRatingLine(city, cardsWidgetUpdate),
    subtitle: getCityCardSubtitle(cardsWidgetUpdate),
  };
}
