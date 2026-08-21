/**
 * resolve-active-promo-banner — flag-agnostic pure resolution of a live offer.
 *
 * Decides whether a Sanity `promoBanner` document is showable at `now`.
 * Feature-flag gating belongs in the loader (Phase 3), not here.
 */

/** Raw Sanity singleton fields used by the resolve step. */
export type PromoBannerDoc = {
  enabled?: boolean | null;
  headline?: string | null;
  promoCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

/** Inputs that uniquely identify a scheduled offer for dismiss tracking. */
export type PromoBannerCampaignParts = {
  startsAt: string;
  endsAt: string;
  promoCode: string;
};

/**
 * Active offer ready for UI / cookie comparison.
 *
 * Window rule: `startsAt <= now < endsAt` (end-exclusive).
 */
export type ActivePromoBanner = {
  headline: string;
  promoCode: string;
  startsAt: string;
  endsAt: string;
  /** Stable id for session dismiss; may contain `|` — encode for cookies. */
  campaignId: string;
};

/**
 * Builds a deterministic campaign id from schedule + code.
 *
 * A new code or new window yields a new id so a prior dismiss does not hide it.
 *
 * @param parts - Trimmed `startsAt`, `endsAt`, and `promoCode`
 */
export function buildPromoBannerCampaignId(
  parts: PromoBannerCampaignParts,
): string {
  return `${parts.startsAt}|${parts.endsAt}|${parts.promoCode}`;
}

/**
 * Trims a string field; returns `null` when missing or blank.
 *
 * @param value - Raw Sanity string
 */
function nonBlank(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" ? trimmed : null;
}

/**
 * Parses an ISO datetime string to epoch ms, or `null` when invalid.
 *
 * @param value - Sanity datetime string
 */
function parseTimeMs(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Returns the active promo when the document is enabled, complete, and in window.
 *
 * Flag-agnostic: callers must gate on the `promo-code` flag separately.
 *
 * @param doc - Published (or fetched) `promoBanner` fields; `null`/`undefined` fail closed
 * @param now - Clock used for the schedule window (injectable for tests)
 * @returns Active offer, or `null` when the bar must stay hidden
 */
export function resolveActivePromoBanner(
  doc: PromoBannerDoc | null | undefined,
  now: Date = new Date(),
): ActivePromoBanner | null {
  if (!doc || doc.enabled !== true) {
    return null;
  }

  const headline = nonBlank(doc.headline);
  const promoCode = nonBlank(doc.promoCode);
  const startsAt = nonBlank(doc.startsAt);
  const endsAt = nonBlank(doc.endsAt);

  if (!headline || !promoCode || !startsAt || !endsAt) {
    return null;
  }

  const startMs = parseTimeMs(startsAt);
  const endMs = parseTimeMs(endsAt);
  if (startMs == null || endMs == null) {
    return null;
  }

  const nowMs = now.getTime();
  // Inclusive start, exclusive end: startsAt <= now < endsAt
  if (nowMs < startMs || nowMs >= endMs) {
    return null;
  }

  return {
    headline,
    promoCode,
    startsAt,
    endsAt,
    campaignId: buildPromoBannerCampaignId({ startsAt, endsAt, promoCode }),
  };
}
