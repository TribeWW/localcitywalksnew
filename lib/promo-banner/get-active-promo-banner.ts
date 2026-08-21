/**
 * get-active-promo-banner — marketing-layout loader for the live promo offer.
 *
 * Plain module (not `"use server"`): safe for Server Components / layouts.
 * Gates on the existing `promo-code` flag, fetches the Sanity singleton, then
 * resolves the schedule window. Fail closed → `null`.
 */

import { promoCode as promoCodeFlag } from "@/flags";
import { client } from "@/sanity/lib/client";
import {
  resolveActivePromoBanner,
  type ActivePromoBanner,
  type PromoBannerDoc,
} from "@/lib/promo-banner/resolve-active-promo-banner";

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/**
 * Published `promoBanner` singleton fields used by {@link resolveActivePromoBanner}.
 *
 * Fixed document id `promoBanner`; drafts are excluded.
 */
export const PROMO_BANNER_QUERY = `*[_type == "promoBanner" && _id == "promoBanner" && ${DRAFT_EXCLUDED}][0]{
  enabled,
  headline,
  promoCode,
  startsAt,
  endsAt
}`;

/**
 * Returns the active promo banner for marketing chrome, or `null` when hidden.
 *
 * Order: feature flag → Sanity fetch (`revalidate: 60`) → pure resolve.
 * Logs and returns `null` on fetch failure.
 *
 * @param now - Optional clock for schedule resolution (tests / deterministic SSR)
 */
export async function getActivePromoBanner(
  now: Date = new Date(),
): Promise<ActivePromoBanner | null> {
  let enabled: boolean;
  try {
    enabled = await promoCodeFlag();
  } catch (error) {
    console.error("[Promo banner] Feature flag evaluation failed", error);
    return null;
  }

  if (!enabled) {
    return null;
  }

  let doc: PromoBannerDoc | null;
  try {
    doc = await client.fetch<PromoBannerDoc | null>(
      PROMO_BANNER_QUERY,
      {},
      { next: { revalidate: 60 } },
    );
  } catch (e) {
    console.error("[Promo banner] Sanity fetch failed", e);
    return null;
  }

  return resolveActivePromoBanner(doc, now);
}
