/**
 * JSON-LD builder for the explore catalog page (CollectionPage + ItemList).
 */

import { SITE_URL, absoluteUrl, tourPageUrl } from "@/lib/site";

const SCHEMA_CONTEXT = "https://schema.org";

/** Minimal catalog row needed to build ItemList entries. */
export type ExploreCatalogJsonLdItem = {
  title: string;
  citySlug: string;
  slug: string;
};

/** Input for {@link buildExploreCollectionPageJsonLd}. */
export type BuildExploreCollectionPageJsonLdInput = {
  name: string;
  description: string;
  url: string;
  items: ExploreCatalogJsonLdItem[];
};

/**
 * Builds a `CollectionPage` JSON-LD document with an `ItemList` of tour URLs.
 *
 * Items without both `citySlug` and `slug` are skipped.
 */
export function buildExploreCollectionPageJsonLd(
  input: BuildExploreCollectionPageJsonLdInput,
): Record<string, unknown> {
  const itemListElement = input.items
    .filter((item) => item.citySlug.trim() && item.slug.trim())
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: tourPageUrl(item.citySlug, item.slug),
    }));

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.url,
    isPartOf: {
      "@type": "WebSite",
      name: "LocalCityWalks",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}

/** Default explore page absolute URL for structured data. */
export const EXPLORE_PAGE_URL = absoluteUrl("/explore");
