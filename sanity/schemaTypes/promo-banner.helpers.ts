/**
 * promo-banner.helpers — pure helpers for the Promo Banner Sanity document schema.
 *
 * Extracted for unit testing and reuse by `promoBanner.ts` (conditional required
 * fields and schedule window validation).
 */

/** Studio error when offer fields are empty while the banner is enabled. */
export const PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE =
  "Required when the promo banner is enabled";

/** Studio error when `endsAt` is not strictly after `startsAt`. */
export const PROMO_BANNER_ENDS_AFTER_STARTS_MESSAGE =
  "End must be after start";

/**
 * Returns whether offer content fields must be filled for the given `enabled` value.
 *
 * @param enabled - Document `enabled` flag from Studio (may be missing on drafts)
 */
export function isPromoBannerContentRequired(enabled: unknown): boolean {
  return enabled === true;
}

/**
 * Validates a string/datetime field that is required only when the banner is enabled.
 *
 * Blank strings (whitespace-only) count as missing.
 *
 * @param value - Field value from Studio
 * @param enabled - Document `enabled` flag
 * @returns `true` when valid, or a user-facing error string
 */
export function validatePromoBannerRequiredWhenEnabled(
  value: unknown,
  enabled: unknown,
): true | string {
  if (!isPromoBannerContentRequired(enabled)) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() !== ""
      ? true
      : PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE;
  }

  if (value == null) {
    return PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE;
  }

  return true;
}

/**
 * Ensures `endsAt` is strictly after `startsAt` when both are present.
 *
 * Missing values are left to the conditional-required rules.
 *
 * @param endsAt - ISO datetime string for the offer end (exclusive at resolve time)
 * @param startsAt - ISO datetime string for the offer start
 * @returns `true` when valid, or a user-facing error string
 */
export function validatePromoBannerEndsAfterStarts(
  endsAt: unknown,
  startsAt: unknown,
): true | string {
  if (typeof endsAt !== "string" || typeof startsAt !== "string") {
    return true;
  }

  const endMs = Date.parse(endsAt);
  const startMs = Date.parse(startsAt);
  if (Number.isNaN(endMs) || Number.isNaN(startMs)) {
    return true;
  }

  return endMs > startMs ? true : PROMO_BANNER_ENDS_AFTER_STARTS_MESSAGE;
}
