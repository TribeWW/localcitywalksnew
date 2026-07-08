/**
 * Marks a pending checkout paid when Stripe Checkout completes (LOC-1165).
 *
 * Resolves the KV row via the Stripe session id index and performs a CAS
 * `pending → paid` transition. Bókun confirm runs in `fulfilPaidCheckout`
 * (LOC-1166); confirmation email is LOC-1170.
 */

import type Stripe from "stripe";

import {
  getPendingCheckoutById,
  getPendingCheckoutByStripeSessionId,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";

export type HandleCheckoutSessionCompletedResult =
  | { success: true; checkoutId: string; alreadyPaid: boolean }
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

  if (pending.status === "paid") {
    return {
      success: true,
      checkoutId: pending.id,
      alreadyPaid: true,
    };
  }

  if (pending.status !== "pending") {
    return { success: false, error: "conflict" };
  }

  const metadataCheckoutId = session.metadata?.checkoutId?.trim();
  if (metadataCheckoutId && metadataCheckoutId !== pending.id) {
    console.warn(
      `[stripe-webhook] session metadata checkoutId mismatch for ${stripeSessionId}`,
    );
  }

  const updateResult = await updatePendingCheckout(
    pending.id,
    { status: "paid" },
    { expectedStatus: "pending" },
  );

  if (updateResult.success) {
    return {
      success: true,
      checkoutId: pending.id,
      alreadyPaid: false,
    };
  }

  if (updateResult.error === "conflict") {
    const latest = await getPendingCheckoutById(pending.id);
    if (latest?.status === "paid") {
      return {
        success: true,
        checkoutId: pending.id,
        alreadyPaid: true,
      };
    }

    return { success: false, error: "conflict" };
  }

  if (updateResult.error === "unavailable") {
    return { success: false, error: "unavailable" };
  }

  return { success: false, error: "not_found" };
}
