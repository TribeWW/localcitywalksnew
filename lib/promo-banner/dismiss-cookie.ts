/**
 * dismiss-cookie — session cookie helpers for promo banner dismiss.
 *
 * Cookie is preference-only (`SameSite=Lax`, no Max-Age/Expires). Value is the
 * URL-encoded campaign id so `|` in ids is safe in `document.cookie`.
 */

/** Browser cookie name for the dismissed promo campaign (confirm with Iubenda before prod). */
export const PROMO_DISMISS_COOKIE_NAME = "lcw_promo_dismiss";

/**
 * URL-encodes a campaign id for use as the cookie value.
 *
 * @param campaignId - Raw id from {@link buildPromoBannerCampaignId}
 */
export function encodePromoDismissCookieValue(campaignId: string): string {
  return encodeURIComponent(campaignId);
}

/**
 * Decodes a raw cookie value back to a campaign id.
 *
 * @param raw - Value from `cookies().get(...)` or an equivalent cookie store
 * @returns Decoded campaign id, or `null` for missing/blank/undecodable garbage
 */
export function parsePromoDismissCampaignId(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(trimmed).trim();
    return decoded !== "" ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Builds a `document.cookie` assignment for dismissing the active campaign.
 *
 * Session cookie (no Max-Age/Expires), `Path=/`, `SameSite=Lax`.
 *
 * @param campaignId - Active offer campaign id to remember for this browser session
 */
export function buildPromoDismissDocumentCookie(campaignId: string): string {
  const value = encodePromoDismissCookieValue(campaignId);
  return `${PROMO_DISMISS_COOKIE_NAME}=${value}; Path=/; SameSite=Lax`;
}

/**
 * Returns whether the cookie value dismisses the given campaign.
 *
 * @param cookieValue - Raw cookie value (already extracted; not a full Cookie header)
 * @param campaignId - Active offer campaign id to compare
 */
export function isPromoDismissedForCampaign(
  cookieValue: string | null | undefined,
  campaignId: string,
): boolean {
  const parsed = parsePromoDismissCampaignId(cookieValue);
  return parsed !== null && parsed === campaignId;
}
