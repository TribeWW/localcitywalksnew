/**
 * Resolves tour page links for checkout error recovery (LOC-1155).
 */

import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { resolveCheckoutTourPageHref } from "@/lib/checkout/resolve-checkout-tour-page-href";

/**
 * Builds the best available tour page href for error recovery CTAs.
 *
 * Fetches Bókun tour detail when possible so city slug is included; falls back
 * to handoff `productTitle` or `/explore`.
 *
 * @param productId - Bókun activity id from handoff payload
 * @param productTitle - Optional title snapshot from handoff token
 */
export async function resolveCheckoutRecoveryTourPageHref(
  productId: string,
  productTitle?: string,
): Promise<string> {
  const detail = await getTourDetailById(productId);

  if (detail.success) {
    return resolveCheckoutTourPageHref(
      productId,
      detail.data.title.trim() || productTitle,
      detail.data.googlePlace?.city,
    );
  }

  return resolveCheckoutTourPageHref(productId, productTitle);
}
