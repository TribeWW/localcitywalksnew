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

  it("returns undefined for unrecognized duration strings", () => {
    expect(durationTextToIso8601("")).toBeUndefined();
    expect(durationTextToIso8601("half day")).toBeUndefined();
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

    expect(json).toMatchObject({
      "@type": "TouristTrip",
      name: "Hello Dijon Walk",
    });
    expect(json).not.toHaveProperty("image");
    expect(json).not.toHaveProperty("offers");
    expect(json).not.toHaveProperty("itinerary");
    expect(json).not.toHaveProperty("duration");
    expect(json).not.toHaveProperty("aggregateRating");
    expect(json).not.toHaveProperty("review");
  });

  it("includes aggregateRating and reviews when hero stats and reviews are provided", () => {
    const json = buildTourPageJsonLd({
      title: "Hello Arles Walk",
      excerpt: "A great tour.",
      url: "https://www.localcitywalks.com/tours/arles/hello-arles-9751538",
      imageUrl: null,
      heroReviewStats: { ratingLabel: "4.7", reviewCount: 3 },
      reviews: [sampleReview],
    });

    expect(json).toMatchObject({
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.7",
        reviewCount: "3",
        bestRating: "5",
        worstRating: "1",
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

    const review = (json as { review: Record<string, unknown>[] }).review[0];
    expect(review).not.toHaveProperty("reviewBody");
  });
});
