/**
 * Bókun photo URL selection for tour pages, Open Graph, and JSON-LD.
 *
 * Bókun `keyPhoto` objects expose an `originalUrl` plus a `derived` array of
 * named CDN sizes (`thumbnail`, `preview`, `large`). These helpers centralize
 * the preference order used across hero galleries and social metadata.
 */

/** Derived size order for Open Graph and JSON-LD images (prefers `large`). */
export const BOKUN_DERIVED_OG_PREFERENCE = ["large", "preview"] as const;

/** Derived size order for hero gallery fallbacks when `originalUrl` is absent. */
export const BOKUN_DERIVED_HERO_PREFERENCE = [
  "large",
  "preview",
  "thumbnail",
] as const;

type BokunPhotoLike = {
  originalUrl?: string;
  derived?: Array<{ name?: string; url?: string }>;
};

/**
 * Picks the first matching URL from a Bókun photo's `derived` array.
 *
 * @param photo - Bókun `keyPhoto` or gallery item (unknown at API boundary).
 * @param preference - Ordered list of `derived[].name` values to try.
 * @returns CDN URL string, or `null` when no derived image is available.
 */
export function pickBokunDerivedPhotoUrl(
  photo: unknown,
  preference: readonly string[],
): string | null {
  const photoData = photo as BokunPhotoLike;
  const derived = photoData?.derived;
  if (!derived?.length) return null;

  for (const name of preference) {
    const hit = derived.find((d) => d?.name === name && d?.url);
    if (hit?.url) return hit.url;
  }

  const any = derived.find((d) => d?.url);
  return any?.url ?? null;
}

/**
 * Picks the best URL for a tour hero image (fullscreen quality).
 *
 * Prefers `originalUrl` when present, then falls back to
 * {@link BOKUN_DERIVED_HERO_PREFERENCE}.
 *
 * @param photo - Bókun `keyPhoto` or gallery item.
 * @returns Image URL string, or `null` when the photo has no usable source.
 */
export function pickBokunHeroPhotoUrl(photo: unknown): string | null {
  const photoData = photo as BokunPhotoLike;

  if (photoData?.originalUrl) return photoData.originalUrl;

  return pickBokunDerivedPhotoUrl(photo, BOKUN_DERIVED_HERO_PREFERENCE);
}

/**
 * Picks the best URL for Open Graph / Twitter card images.
 *
 * Uses CDN `derived` sizes only ({@link BOKUN_DERIVED_OG_PREFERENCE}) — not
 * `originalUrl` — so social crawlers receive a consistently sized image.
 *
 * @param photo - Bókun `keyPhoto`.
 * @returns CDN URL string, or `null` when no derived image is available.
 */
export function pickBokunOgImageUrl(photo: unknown): string | null {
  return pickBokunDerivedPhotoUrl(photo, BOKUN_DERIVED_OG_PREFERENCE);
}
