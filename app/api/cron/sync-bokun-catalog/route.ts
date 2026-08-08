import { NextResponse } from "next/server";
import { syncCitiesFromProducts } from "@/lib/cities/city.actions";
import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";
import { mapSearchProductsToCityCards } from "@/lib/bokun/transform-search-product-to-city-card";
import { warmListingPricesForCards } from "@/lib/city-cards/warm-listing-prices-for-cards";
import {
  cronUnauthorizedResponse,
  isCronRequestAuthorized,
} from "@/lib/cron/verify-cron-request";
import { writeExploreCatalogSnapshot } from "@/lib/explore/catalog-store";

/** Allow enough time for full-catalog Bokun fetch + price warm + Sanity writes. */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Daily cron: sync countries, cities, tour page paths, Tour SEO shells, and the
 * explore catalog Redis snapshot from Bokun.
 *
 * Invoked by Vercel Cron (`vercel.json`) or manually with
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * Pipeline: full Bokun catalog fetch → warm listing prices onto cards →
 * explore Redis snapshot → `syncCitiesFromProducts` (countries → cities →
 * `tourPagePath` → `tourSeoMetadata` shells).
 *
 * GET /api/cron/sync-bokun-catalog
 * Requires `CRON_SECRET`, `SANITY_WRITE_TOKEN`, and Bokun API credentials.
 * Redis (KV/Upstash) is optional; snapshot write is skipped when unset.
 *
 * @param request - Incoming cron request (Bearer auth checked)
 * @returns JSON summary of Bokun fetch, snapshot write, and Sanity sync
 */
export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  try {
    const catalog = await fetchAllBokunSearchProducts();
    if (!catalog.ok) {
      return NextResponse.json(
        { success: false, error: catalog.error },
        { status: 502 },
      );
    }

    const cards = mapSearchProductsToCityCards(
      catalog.products,
      "cron/sync-bokun-catalog",
    );
    const pricedCards = await warmListingPricesForCards(cards);
    const exploreCatalogSnapshotWritten =
      await writeExploreCatalogSnapshot(pricedCards);

    const syncResult = await syncCitiesFromProducts(catalog.products);
    const hasErrors = syncResult.errors.length > 0;

    return NextResponse.json(
      {
        success: !hasErrors,
        bokunProductsFetched: catalog.products.length,
        exploreCatalogSnapshotWritten,
        countries: syncResult.countries,
        cities: syncResult.cities,
        tourSeo: syncResult.tourSeo,
        errors: hasErrors ? syncResult.errors : undefined,
      },
      { status: hasErrors ? 207 : 200 },
    );
  } catch (error) {
    console.error("[cron/sync-bokun-catalog]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
