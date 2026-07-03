/**
 * structured-data/explore — unit tests for CollectionPage JSON-LD builder.
 */

import { describe, expect, it } from "vitest";
import {
  buildExploreCollectionPageJsonLd,
  toExploreJsonLdItems,
} from "@/lib/structured-data/explore";

describe("buildExploreCollectionPageJsonLd", () => {
  it("builds a CollectionPage with an ItemList of tour URLs", () => {
    const json = buildExploreCollectionPageJsonLd({
      name: "Explore tours - LocalCityWalks",
      description: "Browse all city walking tours.",
      url: "https://www.localcitywalks.com/explore",
      items: [
        {
          title: "Toledo",
          citySlug: "toledo",
          slug: "hello-toledo-private-walk-1077682",
        },
        {
          title: "Arles",
          citySlug: "arles",
          slug: "hello-arles-private-walk-9751538",
        },
      ],
    });

    expect(json).toEqual({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Explore tours - LocalCityWalks",
      description: "Browse all city walking tours.",
      url: "https://www.localcitywalks.com/explore",
      isPartOf: {
        "@type": "WebSite",
        name: "LocalCityWalks",
        url: "https://www.localcitywalks.com",
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 2,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Toledo",
            url: "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-walk-1077682",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Arles",
            url: "https://www.localcitywalks.com/tours/arles/hello-arles-private-walk-9751538",
          },
        ],
      },
    });
  });

  it("skips items missing citySlug or slug", () => {
    const json = buildExploreCollectionPageJsonLd({
      name: "Explore",
      description: "Browse tours.",
      url: "https://www.localcitywalks.com/explore",
      items: [
        { title: "Valid", citySlug: "toledo", slug: "hello-toledo-1" },
        { title: "No slug", citySlug: "arles", slug: "" },
        { title: "No city", citySlug: "", slug: "hello-x-1" },
      ],
    });

    const list = (
      json as {
        mainEntity: { numberOfItems: number; itemListElement: unknown[] };
      }
    ).mainEntity;
    expect(list.numberOfItems).toBe(1);
    expect(list.itemListElement).toHaveLength(1);
  });
});

describe("toExploreJsonLdItems", () => {
  it("maps valid city cards and skips incomplete rows", () => {
    expect(
      toExploreJsonLdItems([
        { title: "Toledo", citySlug: "toledo", slug: "hello-toledo-1" },
        { title: "No slug", citySlug: "arles", slug: "" },
      ]),
    ).toEqual([{ title: "Toledo", citySlug: "toledo", slug: "hello-toledo-1" }]);
  });
});
