/**
 * schedule-tour-seo-backfill — full-catalog Tour SEO provisioning after the response.
 *
 * Uses Next.js `after()` so Vercel keeps the function alive long enough to finish
 * Sanity writes (unlike fire-and-forget `scheduleSyncFromSearchItems`).
 */

import { after } from "next/server";
import { syncTourSeoFromProducts } from "@/lib/actions/tour-seo-sync.actions";
import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";

/**
 * Schedules a full Bokun catalog fetch and awaited `syncTourSeoFromProducts` run.
 *
 * Safe to call from Server Components / route handlers; work runs after the response
 * is sent when `after()` is supported.
 */
export function scheduleTourSeoBackfillFromBokun(): void {
  after(async () => {
    try {
      const catalog = await fetchAllBokunSearchProducts();
      if (!catalog.ok) {
        console.error(
          "[Tour SEO Sync] Homepage backfill: Bokun fetch failed",
          catalog.error,
        );
        return;
      }

      const result = await syncTourSeoFromProducts(catalog.products);

      if (result.created.length > 0) {
        console.log(
          "[Tour SEO Sync] Homepage backfill created",
          result.created.length,
          "documents:",
          result.created.join(", "),
        );
      }

      if (result.errors.length > 0) {
        console.error(
          "[Tour SEO Sync] Homepage backfill had",
          result.errors.length,
          "error(s):",
          result.errors,
        );
      }
    } catch (error) {
      console.error("[Tour SEO Sync] Homepage backfill failed:", error);
    }
  });
}
