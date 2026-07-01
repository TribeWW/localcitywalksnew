"use server";

/**
 * tour-seo-sync.actions — auto-provision Tour SEO shell documents in Sanity from Bokun products.
 *
 * Called from the city/country background sync pipeline when listing data is refreshed.
 */

import { writeClient } from "@/sanity/lib/write-client";
import {
  TOUR_SEO_EXISTING_BY_PRODUCT_IDS_QUERY,
  extractTourSeoSyncCandidates,
  partitionTourSeoCandidates,
  tourSeoMetadataDocumentId,
} from "@/lib/tour-seo-sync.helpers";
import type { BokunProduct } from "@/types/bokun";
import type { TourSeoSyncResult } from "@/types/tour-seo-sync";

/**
 * Ensures each Bokun product in the batch has a published `tourSeoMetadata` shell document.
 *
 * Idempotent: existing docs are skipped; new docs store `tour.bokunProductId` and
 * `tour.bokunProductTitle` only — SEO override fields remain empty for code fallbacks
 * until editors fill them in Studio.
 *
 * @param products - Bokun search items from a listing sync batch
 */
export async function syncTourSeoFromProducts(
  products: BokunProduct[],
): Promise<TourSeoSyncResult> {
  const result: TourSeoSyncResult = {
    created: [],
    existing: [],
    errors: [],
  };

  const candidates = extractTourSeoSyncCandidates(products);
  if (candidates.length === 0) {
    return result;
  }

  const ids = candidates.map((candidate) => candidate.productId);

  let existingRows: Array<{ id?: string | null }> = [];
  try {
    existingRows = await writeClient.fetch<Array<{ id?: string | null }>>(
      TOUR_SEO_EXISTING_BY_PRODUCT_IDS_QUERY,
      { ids },
      { perspective: "raw", next: { revalidate: 0 } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Tour SEO Sync] Failed to query existing documents:", error);
    result.errors.push({
      type: "tourSeo",
      identifier: "QUERY_ERROR",
      error: message,
    });
    return result;
  }

  const existingIds = new Set(
    existingRows
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  const { toCreate, existing } = partitionTourSeoCandidates(
    candidates,
    existingIds,
  );
  result.existing = existing;

  for (const candidate of toCreate) {
    try {
      await writeClient.createIfNotExists({
        _id: tourSeoMetadataDocumentId(candidate.productId),
        _type: "tourSeoMetadata",
        tour: {
          bokunProductId: candidate.productId,
          bokunProductTitle: candidate.title,
        },
      });
      result.created.push(candidate.productId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      result.errors.push({
        type: "tourSeo",
        identifier: candidate.productId,
        error: message,
      });
      console.error(
        `[Tour SEO Sync] Failed to create document for product "${candidate.productId}":`,
        error,
      );
    }
  }

  if (result.created.length > 0) {
    console.log(
      `[Tour SEO Sync] Created ${result.created.length} tour SEO documents:`,
      result.created.join(", "),
    );
  }

  return result;
}
