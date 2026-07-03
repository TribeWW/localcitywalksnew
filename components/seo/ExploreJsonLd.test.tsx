/**
 * ExploreJsonLd — unit tests for explore page structured data component.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ExploreJsonLd } from "@/components/seo/ExploreJsonLd";

describe("ExploreJsonLd", () => {
  it("renders CollectionPage JSON-LD with an ItemList of tour links", () => {
    const { container } = render(
      <ExploreJsonLd
        items={[
          {
            title: "Toledo",
            citySlug: "toledo",
            slug: "hello-toledo-private-walk-1077682",
          },
        ]}
      />,
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent ?? "{}");

    expect(parsed).toMatchObject({
      "@type": "CollectionPage",
      url: "https://www.localcitywalks.com/explore",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 1,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Toledo",
            url: "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-walk-1077682",
          },
        ],
      },
    });
  });

  it("renders an empty ItemList when no catalog items are provided", () => {
    const { container } = render(<ExploreJsonLd items={[]} />);

    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')?.textContent ??
        "{}",
    );

    expect(parsed.mainEntity.numberOfItems).toBe(0);
    expect(parsed.mainEntity.itemListElement).toEqual([]);
  });
});
