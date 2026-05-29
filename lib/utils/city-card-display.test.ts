import { describe, expect, it } from "vitest";
import {
  getCityCardPriceLine,
  getCityCardRatingLine,
  getCityCardSubtitle,
  getCityCardTitle,
} from "@/lib/utils/city-card-display";
import type { CityCardData } from "@/types/bokun";

const enrichedCard: Pick<
  CityCardData,
  "title" | "displayPricePerPerson" | "displayPriceCurrency" | "showRating" | "ratingLabel"
> = {
  title: "Barcelona",
  displayPricePerPerson: 124,
  displayPriceCurrency: "EUR",
  showRating: true,
  ratingLabel: "4.7",
};

describe("getCityCardTitle", () => {
  it("prefixes Hello when the cards widget flag is on", () => {
    expect(getCityCardTitle("Barcelona", true)).toBe("Hello Barcelona");
  });

  it("keeps the plain city title when the flag is off", () => {
    expect(getCityCardTitle("Barcelona", false)).toBe("Barcelona");
  });
});

describe("getCityCardPriceLine", () => {
  it("returns the formatted amount when enriched price exists without currency", () => {
    expect(
      getCityCardPriceLine(
        { ...enrichedCard, displayPriceCurrency: undefined },
        true,
      ),
    ).toBe("€124");
  });

  it("returns null when price is missing or the flag is off", () => {
    expect(getCityCardPriceLine(enrichedCard, false)).toBeNull();
    expect(
      getCityCardPriceLine(
        { ...enrichedCard, displayPricePerPerson: undefined },
        true,
      ),
    ).toBeNull();
  });
});

describe("getCityCardRatingLine", () => {
  it("returns the rating label when showRating is true", () => {
    expect(getCityCardRatingLine(enrichedCard, true)).toBe("4.7");
  });

  it("returns null when rating is hidden or the flag is off", () => {
    expect(getCityCardRatingLine(enrichedCard, false)).toBeNull();
    expect(
      getCityCardRatingLine({ ...enrichedCard, showRating: false }, true),
    ).toBeNull();
  });
});

describe("getCityCardSubtitle", () => {
  it("shows Private tour only for the legacy card layout", () => {
    expect(getCityCardSubtitle(false)).toBe("Private tour");
    expect(getCityCardSubtitle(true)).toBeNull();
  });
});
