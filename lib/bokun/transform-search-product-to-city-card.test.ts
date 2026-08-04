import { describe, expect, it, vi } from "vitest";
import {
  mapSearchProductsToCityCards,
  transformSearchProductToCityCard,
} from "@/lib/bokun/transform-search-product-to-city-card";

const keyPhoto = {
  derived: [{ name: "preview", url: "/preview.jpg" }],
};

describe("transformSearchProductToCityCard", () => {
  it("normalizes numeric Bókun ids to digit strings for listing enrichment", () => {
    const card = transformSearchProductToCityCard({
      id: 1077682,
      title: "Hello Toledo Private Walk",
      keyPhoto,
      googlePlace: {
        city: "Toledo",
        country: "Spain",
        countryCode: "ES",
        cityCode: "toledo",
      },
    });

    expect(card.id).toBe("1077682");
    expect(card.slug).toBe("hello-toledo-private-walk-1077682");
    expect(card.title).toBe("Hello Toledo Private Walk");
    expect(card.cityName).toBe("Toledo");
    expect(card.citySlug).toBe("toledo");
    expect(card.displayPricePerPerson).toBeUndefined();
    expect(card.showRating).toBeUndefined();
  });

  it("leaves optional enriched fields unset for base catalog transforms", () => {
    const card = transformSearchProductToCityCard({
      id: "42",
      title: "Barcelona Walk",
      keyPhoto,
    });

    expect(card).toMatchObject({
      id: "42",
      title: "Barcelona Walk",
      image: "/preview.jpg",
    });
    expect(card.ratingLabel).toBeUndefined();
  });

  it("preserves defaultRateId from activity detail payloads", () => {
    const card = transformSearchProductToCityCard({
      id: "1077682",
      title: "Hello Toledo Private Walk",
      keyPhoto,
      defaultRateId: 2199582,
    });

    expect(card.defaultRateId).toBe(2199582);
  });
});

describe("mapSearchProductsToCityCards", () => {
  it("skips malformed products and keeps valid ones", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const cards = mapSearchProductsToCityCards([
      { id: "1", title: "Valid Walk", keyPhoto },
      { id: "", title: "Bad Walk", keyPhoto },
      { id: "3", title: "Another Walk", keyPhoto },
    ]);

    expect(cards.map((c) => c.id)).toEqual(["1", "3"]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
