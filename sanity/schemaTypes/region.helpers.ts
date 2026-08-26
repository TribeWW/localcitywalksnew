/**
 * region.helpers — pure helpers for the region Sanity document schema.
 *
 * Extracted for unit testing (Studio list preview).
 */

/** Inputs for the region document list preview in Sanity Studio. */
export type RegionPreviewInput = {
  name?: string;
  countryName?: string;
};

/** Sanity list preview payload for a region document. */
export type RegionPreview = {
  title: string;
  subtitle?: string;
};

const DEFAULT_PREVIEW_TITLE = "Region";

/**
 * Builds the Studio list preview title and subtitle for a region document.
 *
 * Title: trimmed `name`, or a default label when blank.
 * Subtitle: country name when present.
 *
 * @param input - Selected preview fields from the document
 */
export function prepareRegionPreview(input: RegionPreviewInput): RegionPreview {
  const name =
    typeof input.name === "string" && input.name.trim() !== ""
      ? input.name.trim()
      : DEFAULT_PREVIEW_TITLE;
  const countryName =
    typeof input.countryName === "string" && input.countryName.trim() !== ""
      ? input.countryName.trim()
      : undefined;

  return {
    title: name,
    subtitle: countryName,
  };
}
