/**
 * Async server component that loads explore catalog rows for JSON-LD.
 *
 * Isolated behind a Suspense boundary on `/explore` so the hero and catalog
 * can render without waiting for the full structured-data catalog build.
 */

import { ExploreJsonLd } from "@/components/seo/ExploreJsonLd";
import { getExploreCatalogForStructuredData } from "@/lib/explore-catalog";
import { toExploreJsonLdItems } from "@/lib/structured-data/explore";

/**
 * Fetches the full explore catalog and renders {@link ExploreJsonLd}.
 */
export async function ExploreJsonLdSection() {
  const catalogResult = await getExploreCatalogForStructuredData();
  const items = catalogResult.success
    ? toExploreJsonLdItems(catalogResult.items)
    : [];

  return <ExploreJsonLd items={items} />;
}
