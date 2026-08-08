/**
 * city-card-listing validation — runtime schema for listing enrichment input.
 */

import { describe, expect, it } from "vitest";

import {
  parseCityCardListingInput,
} from "@/lib/validation/city-card-listing";

const baseCard = {
  id: "101",
  title: "Barcelona",
  image: "/preview.jpg",
};

describe("parseCityCardListingInput", () => {
  it("returns a clean card with required fields", () => {
    expect(parseCityCardListingInput(baseCard, 0)).toEqual(baseCard);
  });

  it("strips unknown keys", () => {
    expect(
      parseCityCardListingInput(
        { ...baseCard, evil: true },
        0,
      ),
    ).toEqual(baseCard);
  });

  it("accepts typed optional display fields", () => {
    expect(
      parseCityCardListingInput(
        {
          ...baseCard,
          displayPricePerPerson: 124,
          displayPriceCurrency: "EUR",
          showRating: true,
          ratingLabel: "4.7",
          defaultRateId: 99,
        },
        0,
      ),
    ).toEqual({
      ...baseCard,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
      showRating: true,
      ratingLabel: "4.7",
      defaultRateId: 99,
    });
  });

  it("rejects non-string displayPriceCurrency", () => {
    expect(() =>
      parseCityCardListingInput(
        { ...baseCard, displayPriceCurrency: 123 },
        0,
      ),
    ).toThrow("displayPriceCurrency at index 0");
  });

  it("rejects non-finite displayPricePerPerson", () => {
    expect(() =>
      parseCityCardListingInput(
        { ...baseCard, displayPricePerPerson: Number.NaN },
        0,
      ),
    ).toThrow("displayPricePerPerson at index 0");
  });

  it("rejects empty title with field-specific message", () => {
    expect(() =>
      parseCityCardListingInput({ ...baseCard, title: "" }, 0),
    ).toThrow("title at index 0");
  });
});
