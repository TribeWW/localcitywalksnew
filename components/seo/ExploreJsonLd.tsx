/**
 * Server component that emits CollectionPage JSON-LD for the explore catalog.
 */

import {
  EXPLORE_JSON_LD_NAME,
  EXPLORE_PAGE_DESCRIPTION,
} from "@/lib/explore/page-metadata";
import {
  buildExploreCollectionPageJsonLd,
  EXPLORE_PAGE_URL,
  type ExploreCatalogJsonLdItem,
} from "@/lib/structured-data/explore";
import { JsonLd } from "@/lib/structured-data/json-ld";

type ExploreJsonLdProps = {
  /** Catalog rows used to build the `ItemList` (city name + tour URL per entry). */
  items: ExploreCatalogJsonLdItem[];
};

/**
 * Renders schema.org `CollectionPage` structured data for `/explore`.
 */
export function ExploreJsonLd({ items }: ExploreJsonLdProps) {
  return (
    <JsonLd
      data={buildExploreCollectionPageJsonLd({
        name: EXPLORE_JSON_LD_NAME,
        description: EXPLORE_PAGE_DESCRIPTION,
        url: EXPLORE_PAGE_URL,
        items,
      })}
    />
  );
}
