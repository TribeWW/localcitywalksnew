/**
 * Builds Stripe Checkout `cancel_url` for summary return (LOC-1163 / PRD Task 3.5).
 *
 * **Handoff policy:** preserves the original signed `h` token from Pay click —
 * we do **not** re-mint via `startCheckoutHandoff`. The customer returns to the
 * same summary selection and can pay again while the handoff TTL remains valid.
 */

import { resolveCheckoutOrigin } from "@/lib/stripe/checkout-origin";

/** Inputs for `buildStripeCheckoutCancelUrl`. */
export interface BuildStripeCheckoutCancelUrlParams {
  /** Signed handoff token embedded in the original `/checkout?h=…` link. */
  handoffToken: string;
  /** Internal pending checkout id — used to abort Bókun reserve on return. */
  checkoutId: string;
  /** Public site origin for the cancel redirect; defaults via {@link resolveCheckoutOrigin}. */
  origin?: string;
}

/**
 * Builds `/checkout?h=…&checkoutId=…&cancelled=1` for Stripe hosted Checkout.
 *
 * @param params - Preserved handoff token and pending checkout id
 */
export function buildStripeCheckoutCancelUrl({
  handoffToken,
  checkoutId,
  origin,
}: BuildStripeCheckoutCancelUrlParams): string {
  const resolvedOrigin = origin ?? resolveCheckoutOrigin();
  const params = new URLSearchParams({
    h: handoffToken,
    checkoutId,
    cancelled: "1",
  });

  return `${resolvedOrigin}/checkout?${params.toString()}`;
}
