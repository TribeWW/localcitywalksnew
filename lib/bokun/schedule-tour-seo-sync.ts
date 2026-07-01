/**
 * schedule-tour-seo-sync — background Tour SEO provisioning (fire-and-forget).
 *
 * Mirrors `schedule-search-sync.ts`: does not block page render.
 */

import { syncTourSeoFromProducts } from "@/lib/actions/tour-seo-sync.actions";
import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";
import type { BokunProduct } from "@/types/bokun";

const CATALOG_SYNC_TTL = 15 * 60 * 1000;
let lastCatalogSyncStartedAt = 0;
let catalogSyncInflight: Promise<void> | null = null;

/**
 * Schedule a background sync of Tour SEO shell documents for the given Bokun products.
 *
 * @param items - Bokun search items (full batch or page slice)
 */
export function scheduleTourSeoFromProducts(items: BokunProduct[]): void {
  syncTourSeoFromProducts(items)
    .then((result) => {
      if (result.created.length > 0) {
        console.log(
          "[Tour SEO Sync] Background: created",
          result.created.length,
          "tour SEO documents:",
          result.created.join(", "),
        );
      }
      if (result.errors.length > 0) {
        console.error(
          "[Tour SEO Sync] Background sync had",
          result.errors.length,
          "error(s):",
          result.errors
            .map((e) => `${e.type}:${e.identifier} - ${e.error}`)
            .join("; "),
        );
      }
    })
    .catch((error) => {
      console.error(
        "[Tour SEO Sync] Background sync failed:",
        error instanceof Error ? error.message : error,
      );
    });
}

/**
 * Schedule a full Bokun catalog fetch and Tour SEO sync from the homepage.
 *
 * Throttled to once per 15 minutes per warm server instance (aligned with listing caches).
 */
export function scheduleTourSeoSyncFromBokunCatalog(): void {
  const now = Date.now();
  if (now - lastCatalogSyncStartedAt < CATALOG_SYNC_TTL) {
    return;
  }
  if (catalogSyncInflight) {
    return;
  }

  lastCatalogSyncStartedAt = now;
  catalogSyncInflight = fetchAllBokunSearchProducts()
    .then((catalog) => {
      if (!catalog.ok) {
        console.error(
          "[Tour SEO Sync] Background catalog fetch failed:",
          catalog.error,
        );
        return;
      }
      scheduleTourSeoFromProducts(catalog.products);
    })
    .catch((error) => {
      console.error(
        "[Tour SEO Sync] Homepage catalog sync failed:",
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      catalogSyncInflight = null;
    });
}
