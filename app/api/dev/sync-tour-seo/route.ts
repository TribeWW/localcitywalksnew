import { NextResponse } from "next/server";
import { syncTourSeoFromProducts } from "@/lib/actions/tour-seo-sync.actions";
import {
  devSyncUnauthorizedResponse,
  isDevSyncRequestAuthorized,
} from "@/lib/dev/verify-dev-sync-request";
import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";
/** Allow enough time for full-catalog Bokun fetch + sequential Sanity creates. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Ops / dev: backfill published `tourSeoMetadata` shell documents from the full Bokun catalog.
 *
 * Awaits the sync (unlike the fire-and-forget explore listing path) so Vercel/serverless
 * completes writes before the HTTP response ends.
 *
 * GET /api/dev/sync-tour-seo?confirm=yes&token=YOUR_DEV_SYNC_TOKEN
 * Requires `SANITY_WRITE_TOKEN` and Bokun API credentials.
 * In production, set `DEV_SYNC_TOKEN` and pass it as `token` (browser) or `x-dev-sync-token` (curl).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!isDevSyncRequestAuthorized(request)) {
    return devSyncUnauthorizedResponse();
  }  if (searchParams.get("confirm") !== "yes") {
    return NextResponse.json(
      {
        error:
          "Add ?confirm=yes to run a full Bokun → Sanity Tour SEO backfill.",
      },
      { status: 400 },
    );
  }

  try {
    const catalog = await fetchAllBokunSearchProducts();
    if (!catalog.ok) {
      return NextResponse.json(
        { success: false, error: catalog.error },
        { status: 502 },
      );
    }

    const syncResult = await syncTourSeoFromProducts(catalog.products);

    const hasErrors = syncResult.errors.length > 0;
    return NextResponse.json(
      {
        success: !hasErrors,
        bokunProductsFetched: catalog.products.length,
        created: syncResult.created,
        existing: syncResult.existing,
        errors: hasErrors ? syncResult.errors : undefined,
      },
      { status: hasErrors ? 207 : 200 },
    );
  } catch (error) {
    console.error("[sync-tour-seo]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
