/**
 * tour-seo-metadata.helpers — pure helpers for the Tour SEO Sanity document schema.
 *
 * Extracted for unit testing and reuse by `tourSeoMetaData.ts` (validation + Studio preview).
 */

import type { ValidationContext } from "sanity";
import { apiVersion } from "../env";

/** Bokun product ids stored on tour URLs are digits-only (e.g. `1077682`). */
export const DIGITS_ONLY_BOKUN_PRODUCT_ID = /^\d+$/;

/**
 * GROQ query used by document-level validation to count conflicting Tour SEO docs.
 *
 * Excludes the current published and draft ids so editors can save without false positives.
 */
export const TOUR_SEO_DUPLICATE_COUNT_QUERY = `count(*[_type == "tourSeoMetadata" && tour.bokunProductId == $tourId && !(_id in [$publishedId, $draftId])])`;

/** Tour picker value stored on `tourSeoMetadata.tour`. */
export type TourSeoTourValue = {
  bokunProductId?: string;
  bokunProductTitle?: string;
};

/** Inputs for the Tour SEO document list preview in Sanity Studio. */
export type TourSeoMetadataPreviewInput = {
  seoTitle?: string;
  bokunProductTitle?: string;
  bokunProductId?: string;
};

/** Sanity list preview payload for a Tour SEO document. */
export type TourSeoMetadataPreview = {
  title: string;
  subtitle?: string;
};

/** Published and draft `_id` pair for the same Sanity document. */
export type SanityDraftPublishedIds = {
  publishedId: string;
  draftId: string;
};

const DEFAULT_PREVIEW_TITLE = "Tour SEO Meta Data";

const DUPLICATE_TOUR_SEO_MESSAGE = "An SEO document already exists for this tour";

/**
 * Returns whether `value` is a non-empty Bokun product id (digits only).
 *
 * @param value - Candidate product id from Studio or API payloads
 */
export function isDigitsOnlyBokunProductId(value: string): boolean {
  return DIGITS_ONLY_BOKUN_PRODUCT_ID.test(value);
}

/**
 * Derives published and draft `_id` values from either form of a Sanity document id.
 *
 * @param rawId - `_id` from the document being validated (with or without `drafts.` prefix)
 */
export function resolveSanityDraftPublishedIds(
  rawId: string,
): SanityDraftPublishedIds {
  const publishedId = rawId.replace(/^drafts\./, "");
  const draftId = rawId.startsWith("drafts.")
    ? rawId
    : `drafts.${publishedId}`;

  return { publishedId, draftId };
}

/**
 * Builds the Studio list preview title and subtitle for a Tour SEO document.
 *
 * Title priority: `seoTitle` → `bokunProductTitle` → default label.
 * Subtitle combines tour title and product id when available.
 *
 * @param input - Selected preview fields from the document
 */
export function prepareTourSeoMetadataPreview(
  input: TourSeoMetadataPreviewInput,
): TourSeoMetadataPreview {
  const { seoTitle, bokunProductTitle, bokunProductId } = input;
  const title = seoTitle || bokunProductTitle || DEFAULT_PREVIEW_TITLE;

  const subtitleParts: string[] = [];
  if (bokunProductTitle) subtitleParts.push(bokunProductTitle);
  if (bokunProductId) subtitleParts.push(`ID: ${bokunProductId}`);

  return {
    title,
    subtitle:
      subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined,
  };
}

/**
 * Sanity document-level validation: at most one Tour SEO doc per Bokun product id.
 *
 * Skips the GROQ lookup when `_id` or `tour.bokunProductId` is missing so field-level
 * validation can surface those errors first.
 *
 * @param _ - Unused Sanity validation value (document-level rules receive `undefined`)
 * @param context - Sanity validation context with document and API client
 * @returns `true` when unique, or a user-facing error string when a duplicate exists
 */
export async function validateUniqueTourSeoDocument(
  _: unknown,
  context: ValidationContext,
): Promise<true | string> {
  const rawId = context.document?._id;
  if (!rawId) return true;

  const tour = context.document?.tour as TourSeoTourValue | undefined;
  const tourId = tour?.bokunProductId;
  if (!tourId) return true;

  const { publishedId, draftId } = resolveSanityDraftPublishedIds(rawId);

  const client = context.getClient({ apiVersion });
  const count = await client.fetch<number>(TOUR_SEO_DUPLICATE_COUNT_QUERY, {
    tourId,
    publishedId,
    draftId,
  });

  return count === 0 || DUPLICATE_TOUR_SEO_MESSAGE;
}
