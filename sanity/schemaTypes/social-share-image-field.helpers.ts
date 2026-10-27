/**
 * Pure helpers for Social Share Image Studio validation.
 */

export const SOCIAL_SHARE_MIN_WIDTH = 1200;
export const SOCIAL_SHARE_MIN_HEIGHT = 630;

export const SOCIAL_SHARE_SIZE_WARNING = "Image is smaller than 1200×630 px.";

export const SOCIAL_SHARE_ALT_WARNING = "Add text describing the image.";

export const SOCIAL_SHARE_DIMENSIONS_FETCH_WARNING =
  "Could not verify image dimensions. Please try again.";

export type ImageDimensions = {
  width?: number | null;
  height?: number | null;
};

/**
 * Returns a size warning when dimensions are known and below 1200×630.
 * Returns `true` when dimensions are missing (skip) or large enough.
 */
export function validateSocialShareImageSize(
  dimensions: ImageDimensions | null | undefined,
): true | string {
  const width = dimensions?.width;
  const height = dimensions?.height;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return true;
  }

  if (width < SOCIAL_SHARE_MIN_WIDTH || height < SOCIAL_SHARE_MIN_HEIGHT) {
    return SOCIAL_SHARE_SIZE_WARNING;
  }

  return true;
}

/**
 * Runs size validation after fetching dimensions; warns when the fetch rejects.
 */
export async function validateSocialShareImageSizeFromFetch(
  fetchDimensions: () => Promise<ImageDimensions | null | undefined>,
): Promise<true | string> {
  try {
    return validateSocialShareImageSize(await fetchDimensions());
  } catch {
    return SOCIAL_SHARE_DIMENSIONS_FETCH_WARNING;
  }
}

/**
 * Warns when an image asset is present but alt text is blank.
 */
export function validateSocialShareImageAlt(
  alt: unknown,
  hasImageAsset: boolean,
): true | string {
  if (!hasImageAsset) return true;
  if (typeof alt === "string" && alt.trim() !== "") return true;
  return SOCIAL_SHARE_ALT_WARNING;
}
