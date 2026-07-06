/**
 * TourJsonLd — unit tests for tour page structured data component.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { TourJsonLd } from "@/components/seo/TourJsonLd";
import type { SanityReviewListItem } from "@/types/review";

const sampleReview: SanityReviewListItem = {
  _id: "rev-1",
  tourId: "1077682",
  rating: 5,
  experienceDate: "2025-06-15",
  authorName: "Jane Doe",
  body: "A wonderful walk.",
};

describe("TourJsonLd", () => {
  it("renders TouristTrip JSON-LD with core tour fields", () => {
    const { container } = render(
      <TourJsonLd
        title="Hello Toledo: Private 2-Hour Intro City Walk"
        excerpt="Discover Toledo with a local guide."
        url="https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682"
        imageUrl="https://imgcdn.bokun.tools/example.jpg?w=660&h=660"
        cityName="Toledo"
        durationText="2 hours"
      />,
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();

    const parsed = JSON.parse(script?.textContent ?? "{}");
    expect(parsed).toMatchObject({
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: "Hello Toledo: Private 2-Hour Intro City Walk",
      description: "Discover Toledo with a local guide.",
      url: "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682",
      image: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
      touristType: "Sightseeing",
      duration: "PT2H",
    });
  });

  it("includes aggregateRating and reviews on Product when provided", () => {
    const { container } = render(
      <TourJsonLd
        title="Hello Arles Walk"
        url="https://www.localcitywalks.com/tours/arles/hello-arles-9751538"
        imageUrl={null}
        heroReviewStats={{ ratingLabel: "4.7", reviewCount: 3 }}
        reviews={[sampleReview]}
      />,
    );

    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? "{}",
    );

    const graph = parsed["@graph"] as Record<string, unknown>[];
    const trip = graph.find((node) => node["@type"] === "TouristTrip");
    const product = graph.find((node) => node["@type"] === "Product");

    expect(trip).toBeDefined();
    expect(trip).not.toHaveProperty("aggregateRating");
    expect(trip).not.toHaveProperty("review");

    expect(product?.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "3",
    });
    expect(product?.review).toHaveLength(1);
    expect(
      (product?.review as { author: { name: string } }[])?.[0].author.name,
    ).toBe("Jane Doe");
  });

  it("omits review fields when no reviews are visible on the page", () => {
    const { container } = render(
      <TourJsonLd
        title="Hello Dijon Walk"
        url="https://www.localcitywalks.com/tours/dijon/hello-dijon-1107331"
        imageUrl={null}
      />,
    );

    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? "{}",
    );

    expect(parsed["@type"]).toBe("TouristTrip");
    expect(parsed).not.toHaveProperty("@graph");
    expect(parsed).not.toHaveProperty("aggregateRating");
    expect(parsed).not.toHaveProperty("review");
  });
});
