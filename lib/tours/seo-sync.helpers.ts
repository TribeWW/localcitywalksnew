/**
 * tour-seo-sync.helpers — pure helpers for Tour SEO Sanity auto-provision during Bokun sync.
 *
 * Extracted for unit testing and reuse by `tour-seo-sync.actions.ts`.
 */

import { toBokunProductIdDigits } from "@/lib/utils/bokun-product-id";
import type { BokunProduct } from "@/types/bokun";

/**
 * GROQ query listing existing Tour SEO documents for a batch of Bokun product ids.
 *
 * Uses `perspective: "raw"` at the call site so draft overlays are included.
 */
export const TOUR_SEO_EXISTING_BY_PRODUCT_IDS_QUERY = `*[_type == "tourSeoMetadata" && tour.bokunProductId in $ids]{
  "id": tour.bokunProductId
}`;

/** Minimal product row needed to create a Tour SEO shell document. */
export type TourSeoSyncCandidate = {
  productId: string;
  title: string;
};

/** Result of partitioning sync candidates by existing Sanity product ids. */
export type TourSeoCandidatePartition = {
  toCreate: TourSeoSyncCandidate[];
  existing: string[];
};

/**
 * Returns the deterministic published Sanity document id for a Bokun product.
 *
 * @param productId - Digits-only Bokun product id
 */
export function tourSeoMetadataDocumentId(productId: string): string {
  return `tourSeoMetadata-${productId}`;
}

/**
 * Extracts unique, valid Bokun products from a search batch for Tour SEO provisioning.
 *
 * Skips invalid ids and dedupes by normalized product id (first title wins).
 *
 * @param products - Bokun search items from a listing sync batch
 */
export function extractTourSeoSyncCandidates(
  products: BokunProduct[],
): TourSeoSyncCandidate[] {
  const seen = new Set<string>();
  const candidates: TourSeoSyncCandidate[] = [];

  for (const product of products) {
    const productId = toBokunProductIdDigits(product.id);
    if (!productId || seen.has(productId)) continue;

    seen.add(productId);
    const title =
      typeof product.title === "string" ? product.title.trim() : "";
    candidates.push({
      productId,
      title: title || productId,
    });
  }

  return candidates;
}

/**
 * Splits sync candidates into rows to create vs product ids that already have docs.
 *
 * @param candidates - Unique products from {@link extractTourSeoSyncCandidates}
 * @param existingProductIds - Product ids already present in Sanity
 */
export function partitionTourSeoCandidates(
  candidates: TourSeoSyncCandidate[],
  existingProductIds: ReadonlySet<string>,
): TourSeoCandidatePartition {
  const toCreate: TourSeoSyncCandidate[] = [];
  const existing: string[] = [];

  for (const candidate of candidates) {
    if (existingProductIds.has(candidate.productId)) {
      existing.push(candidate.productId);
    } else {
      toCreate.push(candidate);
    }
  }

  return { toCreate, existing };
}
