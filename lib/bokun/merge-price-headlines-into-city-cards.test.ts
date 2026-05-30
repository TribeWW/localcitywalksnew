import { describe, expect, it } from "vitest";
import { mergePriceHeadlinesIntoCityCards } from "@/lib/bokun/merge-price-headlines-into-city-cards";
import type { CityCardData } from "@/types/bokun";

const baseCard: CityCardData = {
  id: "1077682",
  title: "Barcelona",
  image: "/preview.jpg",
  citySlug: "barcelona",
  slug: "hello-barcelona-1077682",
};

describe("mergePriceHeadlinesIntoCityCards", () => {
  it("merges enriched headline fields onto matching cards", () => {
    const headlines = new Map([
      ["1077682", { amount: 124, currency: "EUR" }],
    ]);

    const [merged] = mergePriceHeadlinesIntoCityCards([baseCard], headlines);

    expect(merged).toEqual({
      ...baseCard,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
    });
  });

  it("leaves cards unchanged when no headline exists for that id", () => {
    const [merged] = mergePriceHeadlinesIntoCityCards(
      [baseCard],
      new Map([["9999999", { amount: 99, currency: "EUR" }]]),
    );

    expect(merged).toEqual(baseCard);
    expect(merged.displayPricePerPerson).toBeUndefined();
    expect(merged.displayPriceCurrency).toBeUndefined();
  });

  it("finds headlines when card.id is not normalized to map keys", () => {
    const cardWithNumericId = {
      ...baseCard,
      id: 1077682 as unknown as string,
    };

    const [merged] = mergePriceHeadlinesIntoCityCards(
      [cardWithNumericId],
      new Map([["1077682", { amount: 124, currency: "EUR" }]]),
    );

    expect(merged).toMatchObject({
      id: 1077682,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
    });
  });

  it("matches producer-normalized headline keys for composite card ids", () => {
    const cardWithCompositeId = {
      ...baseCard,
      id: "tour-1077682",
    };
    const cards = [cardWithCompositeId];
    const headlines = new Map([["1077682", { amount: 124, currency: "EUR" }]]);

    const [merged] = mergePriceHeadlinesIntoCityCards(cards, headlines);

    expect(merged).toMatchObject({
      id: "tour-1077682",
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
    });
    expect(cards[0]).toEqual(cardWithCompositeId);
  });

  it("does not mutate the input card array", () => {
    const cards = [baseCard];
    mergePriceHeadlinesIntoCityCards(cards, new Map());

    expect(cards[0]).toEqual(baseCard);
  });
});
