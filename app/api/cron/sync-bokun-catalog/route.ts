import { NextResponse } from "next/server";
import { syncCitiesFromProducts } from "@/lib/actions/city.actions";
import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";
import {
  cronUnauthorizedResponse,
  isCronRequestAuthorized,
} from "@/lib/cron/verify-cron-request";

/** Allow enough time for full-catalog Bokun fetch + sequential Sanity writes. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Daily cron: sync countries, cities, tour page paths, and Tour SEO shells from Bokun.
 *
 * Invoked by Vercel Cron (`vercel.json`) or manually with
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * Pipeline: full Bokun catalog fetch → `syncCitiesFromProducts` (countries → cities →
 * `tourPagePath` → `tourSeoMetadata` shells).
 *
 * GET /api/cron/sync-bokun-catalog
 * Requires `CRON_SECRET`, `SANITY_WRITE_TOKEN`, and Bokun API credentials.
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

    const syncResult = await syncCitiesFromProducts(catalog.products);
    const hasErrors = syncResult.errors.length > 0;

    return NextResponse.json(
      {
        success: !hasErrors,
        bokunProductsFetched: catalog.products.length,
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
