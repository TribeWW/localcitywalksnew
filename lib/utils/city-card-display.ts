import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import type { CityCardData } from "@/types/bokun";

type CityCardDisplayFields = Pick<
  CityCardData,
  | "title"
  | "cityName"
  | "displayPricePerPerson"
  | "displayPriceCurrency"
  | "showRating"
  | "ratingLabel"
>;

/** Returns the listing card headline (Bókun product title). */
export function getCityCardTitle(displayTitle: string): string {
  return displayTitle;
}

/** City name for the minimal card headline (`Hello` + city). */
export function getCityCardCityName(
  city: Pick<CityCardData, "cityName" | "title">,
): string {
  if (city.cityName?.trim()) {
    return city.cityName.trim();
  }

  const match = /^Hello\s+([^:]+)/i.exec(city.title?.trim() ?? "");
  if (match?.[1]) {
    return match[1].trim();
  }

  return city.title?.trim() || "Tour";
}

/** Descriptive alt text for listing card photos (not the greeting headline). */
export function getCityCardImageAlt(cityTitle: string): string {
  const city = cityTitle.trim();
  if (!city) {
    return "City tour photo";
  }

  return `${city} photo`;
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
    title: getCityCardTitle(city.title),
    cityName: getCityCardCityName(city),
    priceAmount: getCityCardPriceAmount(city, cardsWidgetUpdate),
    ratingLine: getCityCardRatingLine(city, cardsWidgetUpdate),
    subtitle: getCityCardSubtitle(cardsWidgetUpdate),
  };
}
