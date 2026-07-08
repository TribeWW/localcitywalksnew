/**
 * Marks a pending checkout paid when Stripe Checkout completes (LOC-1165).
 *
 * Resolves the KV row via the Stripe session id index, then uses an atomic
 * Redis claim so only one concurrent webhook delivery advances to Bókun
 * fulfilment (`shouldFulfil: true`); losers exit without advancing. The winner
 * performs the `pending → paid` transition. Bókun confirm runs in
 * `fulfilPaidCheckout` (LOC-1166); confirmation email is LOC-1170.
 */

import type Stripe from "stripe";

import {
  claimPendingCheckoutPaidFulfilment,
  getPendingCheckoutByStripeSessionId,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";

export type HandleCheckoutSessionCompletedResult =
  | {
      success: true;
      checkoutId: string;
      /** True only for the delivery that won the atomic claim and may fulfil. */
      shouldFulfil: boolean;
      alreadyPaid: boolean;
      productConfirmationCode?: string;
    }
  | {
      success: false;
      error: "invalid_session" | "not_found" | "unavailable" | "conflict";
    };

/**
 * Confirms payment for a completed Stripe Checkout Session.
 *
 * @param session - `checkout.session.completed` event payload object
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<HandleCheckoutSessionCompletedResult> {
  const stripeSessionId = session.id?.trim();
  if (!stripeSessionId) {
    return { success: false, error: "invalid_session" };
  }

  if (session.payment_status !== "paid") {
    return { success: false, error: "invalid_session" };
  }

  const pending = await getPendingCheckoutByStripeSessionId(stripeSessionId);
  if (!pending) {
    return { success: false, error: "not_found" };
  }

  if (pending.status !== "pending" && pending.status !== "paid") {
    return { success: false, error: "conflict" };
  }

  const metadataCheckoutId = session.metadata?.checkoutId?.trim();
  if (metadataCheckoutId && metadataCheckoutId !== pending.id) {
    console.warn(
      `[stripe-webhook] session metadata checkoutId mismatch for ${stripeSessionId}`,
    );
  }

  const claim = await claimPendingCheckoutPaidFulfilment(pending.id);
  if (!claim.success) {
    return { success: false, error: "unavailable" };
  }

  if (claim.outcome === "in_progress") {
    return {
      success: true,
      checkoutId: pending.id,
      shouldFulfil: false,
      alreadyPaid: true,
      productConfirmationCode: pending.productConfirmationCode,
    };
  }

  if (pending.status === "pending") {
    const updateResult = await updatePendingCheckout(
      pending.id,
      { status: "paid" },
      { expectedStatus: "pending" },
    );

    if (!updateResult.success) {
      if (updateResult.error === "unavailable") {
        return { success: false, error: "unavailable" };
      }
      if (updateResult.error === "not_found") {
        return { success: false, error: "not_found" };
      }
      // A conflict here would mean the row left `pending` despite winning the
      // claim; treat the payment as already recorded and let fulfilment proceed.
    }
  }

  return {
    success: true,
    checkoutId: pending.id,
    shouldFulfil: true,
    alreadyPaid: pending.status === "paid",
    productConfirmationCode: pending.productConfirmationCode,
  };
}
