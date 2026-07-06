/**
 * structured-data/tour — unit tests for TouristTrip JSON-LD builders.
 */

import { describe, expect, it } from "vitest";
import type { SanityReviewListItem } from "@/types/review";
import {
  buildTourPageJsonLd,
  durationTextToIso8601,
  plainTextForSchema,
} from "@/lib/structured-data/tour";

/** Reads the TouristTrip node from a tour page JSON-LD payload. */
function getTouristTripNode(json: Record<string, unknown>) {
  if (json["@type"] === "TouristTrip") return json;
  const graph = json["@graph"] as Record<string, unknown>[] | undefined;
  return graph?.find((node) => node["@type"] === "TouristTrip");
}

/** Reads the Product node from a tour page JSON-LD payload (reviews/ratings). */
function getProductNode(json: Record<string, unknown>) {
  const graph = json["@graph"] as Record<string, unknown>[] | undefined;
  return graph?.find((node) => node["@type"] === "Product");
}

const sampleReview: SanityReviewListItem = {
  _id: "rev-1",
  tourId: "9751538",
  rating: 5,
  experienceDate: "2025-06-15",
  authorName: "Jane Doe",
  body: "Wonderful walk through the old town.",
};

describe("plainTextForSchema", () => {
  it("prefers excerpt when provided", () => {
    expect(
      plainTextForSchema({
        excerpt: "Short intro.",
        htmlDescription: "<p>Long HTML</p>",
      }),
    ).toBe("Short intro.");
  });

  it("strips HTML tags from the fallback description", () => {
    expect(
      plainTextForSchema({
        htmlDescription: "<p>Hello <strong>Arles</strong>.</p>",
      }),
    ).toBe("Hello Arles.");
  });

  it("returns empty string when no description is available", () => {
    expect(plainTextForSchema({})).toBe("");
  });
});

describe("durationTextToIso8601", () => {
  it("converts hour-based duration text to ISO 8601", () => {
    expect(durationTextToIso8601("2 hours")).toBe("PT2H");
    expect(durationTextToIso8601("1 hour")).toBe("PT1H");
  });

  it("converts minute-based duration text to ISO 8601", () => {
    expect(durationTextToIso8601("30 minutes")).toBe("PT30M");
    expect(durationTextToIso8601("1 minute")).toBe("PT1M");
  });

  it("converts day-based duration text to ISO 8601", () => {
    expect(durationTextToIso8601("1 day")).toBe("P1D");
    expect(durationTextToIso8601("3 days")).toBe("P3D");
  });

  it("returns undefined for unrecognized duration strings", () => {
    expect(durationTextToIso8601("")).toBeUndefined();
    expect(durationTextToIso8601("half day")).toBeUndefined();
    expect(durationTextToIso8601("0 hours")).toBeUndefined();
  });
});

describe("buildTourPageJsonLd", () => {
  it("builds a TouristTrip with core fields and provider", () => {
    const json = buildTourPageJsonLd({
      title: "Hello Arles: Private 2-Hour Intro City Walk",
      excerpt: "Discover Arles with a local guide.",
      url: "https://www.localcitywalks.com/tours/arles/hello-arles-9751538",
      imageUrl: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
      cityName: "Arles",
      durationText: "2 hours",
      fromPriceAmount: 89,
      fromPriceCurrency: "EUR",
    });

    expect(json).toEqual({
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: "Hello Arles: Private 2-Hour Intro City Walk",
      description: "Discover Arles with a local guide.",
      url: "https://www.localcitywalks.com/tours/arles/hello-arles-9751538",
      image: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
      touristType: "Sightseeing",
      duration: "PT2H",
      provider: {
        "@type": "Organization",
        name: "LocalCityWalks",
        url: "https://www.localcitywalks.com",
      },
      itinerary: {
        "@type": "City",
        name: "Arles",
      },
      offers: {
        "@type": "Offer",
        price: "89",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://www.localcitywalks.com/tours/arles/hello-arles-9751538",
      },
    });
  });

  it("omits optional fields when data is missing", () => {
    const json = buildTourPageJsonLd({
      title: "Hello Dijon Walk",
      url: "https://www.localcitywalks.com/tours/dijon/hello-dijon-1107331",
      imageUrl: null,
    });

    const trip = getTouristTripNode(json);
    expect(trip).toMatchObject({
      "@type": "TouristTrip",
      name: "Hello Dijon Walk",
    });
    expect(trip).not.toHaveProperty("image");
    expect(trip).not.toHaveProperty("offers");
    expect(trip).not.toHaveProperty("itinerary");
    expect(trip).not.toHaveProperty("duration");
    expect(trip).not.toHaveProperty("aggregateRating");
    expect(trip).not.toHaveProperty("review");
    expect(json).not.toHaveProperty("@graph");
  });

  it("puts aggregateRating and reviews on a Product node in @graph, not on TouristTrip", () => {
    const json = buildTourPageJsonLd({
      title: "Hello Ghent Walk",
      excerpt: "A great tour.",
      url: "https://www.localcitywalks.com/tours/ghent/hello-ghent-12345",
      imageUrl: "https://imgcdn.bokun.tools/ghent.jpg?w=660&h=660",
      cityName: "Ghent",
      durationText: "2 hours",
      fromPriceAmount: 89,
      fromPriceCurrency: "EUR",
      heroReviewStats: { ratingLabel: "4.7", reviewCount: 3 },
      reviews: [sampleReview],
    });

    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@graph"]).toHaveLength(2);

    const trip = getTouristTripNode(json);
    expect(trip).toMatchObject({
      "@type": "TouristTrip",
      name: "Hello Ghent Walk",
      touristType: "Sightseeing",
      duration: "PT2H",
    });
    expect(trip).not.toHaveProperty("aggregateRating");
    expect(trip).not.toHaveProperty("review");

    const product = getProductNode(json);
    expect(product).toMatchObject({
      "@type": "Product",
      name: "Hello Ghent Walk",
      url: "https://www.localcitywalks.com/tours/ghent/hello-ghent-12345",
      image: "https://imgcdn.bokun.tools/ghent.jpg?w=660&h=660",
      description: "A great tour.",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.7",
        reviewCount: "3",
        bestRating: "5",
        worstRating: "1",
      },
      offers: {
        "@type": "Offer",
        price: "89",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://www.localcitywalks.com/tours/ghent/hello-ghent-12345",
      },
      review: [
        {
          "@type": "Review",
          author: { "@type": "Person", name: "Jane Doe" },
          reviewRating: {
            "@type": "Rating",
            ratingValue: "5",
            bestRating: "5",
            worstRating: "1",
          },
          reviewBody: "Wonderful walk through the old town.",
          datePublished: "2025-06-15",
        },
      ],
    });
  });

  it("omits reviewBody when the review has no body text", () => {
    const json = buildTourPageJsonLd({
      title: "Tour",
      url: "https://www.localcitywalks.com/tours/x/y",
      imageUrl: null,
      heroReviewStats: { ratingLabel: "5.0", reviewCount: 1 },
      reviews: [{ ...sampleReview, body: null }],
    });

    const product = getProductNode(json);
    const review = (product?.review as Record<string, unknown>[])?.[0];
    expect(review).not.toHaveProperty("reviewBody");
  });
});
