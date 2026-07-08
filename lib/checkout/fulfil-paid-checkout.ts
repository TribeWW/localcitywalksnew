/**
 * Bókun confirm-reserved fulfilment for paid checkouts (LOC-1166 / PRD Task 4.3).
 *
 * Called from the Stripe webhook after the pending row is marked `paid`.
 * Confirms the held Bókun reservation and persists booking identifiers on
 * the KV row for the success page and confirmation email (LOC-1167 / LOC-1170).
 */

import type Stripe from "stripe";

import {
  getPendingCheckoutById,
  releasePendingCheckoutPaidFulfilment,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";
import { confirmReservedBokunCheckout } from "@/lib/bokun/checkout";

export type FulfilPaidCheckoutResult =
  | {
      success: true;
      checkoutId: string;
      alreadyFulfilled: boolean;
      productConfirmationCode: string;
    }
  | {
      success: false;
      error:
        | "not_found"
        | "unavailable"
        | "not_paid"
        | "missing_reservation"
        | "confirm_failed"
        | "invalid_response";
    };

/**
 * Resolves the Stripe payment reference used in Bókun transaction details.
 *
 * @param session - Completed Stripe Checkout Session from the webhook
 */
export function resolveStripeCheckoutTransactionId(
  session: Stripe.Checkout.Session,
): string | null {
  const paymentIntent = session.payment_intent;
  if (typeof paymentIntent === "string") {
    const trimmed = paymentIntent.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (
    paymentIntent &&
    typeof paymentIntent === "object" &&
    "id" in paymentIntent &&
    typeof paymentIntent.id === "string"
  ) {
    const trimmed = paymentIntent.id.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const sessionId = session.id?.trim();
  return sessionId || null;
}

/** Bounded local-write retries for persisting Bókun fulfilment fields. */
export const FULFILMENT_PERSIST_MAX_ATTEMPTS = 3;

/**
 * Persists Bókun booking identifiers on the pending checkout row with a bounded
 * local-write retry, so a transient KV blip after a successful Bókun confirm
 * does not lose the confirmation.
 *
 * @param checkoutId - Internal pending checkout uuid
 * @param data - Booking id + product confirmation code from Bókun confirm
 */
async function persistBokunFulfilment(
  checkoutId: string,
  data: { bokunBookingId: string; productConfirmationCode: string },
): Promise<boolean> {
  for (let attempt = 1; attempt <= FULFILMENT_PERSIST_MAX_ATTEMPTS; attempt += 1) {
    const updateResult = await updatePendingCheckout(checkoutId, {
      bokunBookingId: data.bokunBookingId,
      productConfirmationCode: data.productConfirmationCode,
    });

    if (updateResult.success) {
      return true;
    }
  }

  return false;
}

/**
 * Confirms a paid pending checkout with Bókun and stores fulfilment fields.
 *
 * Pre-confirm failures (before Bókun confirmation) release the atomic
 * paid-fulfilment claim so a Stripe retry can immediately re-acquire it. Once
 * Bókun confirmation has completed, the claim is never released — even if
 * persistence fails — so a retry cannot re-run confirmation and double-book;
 * persistence is retried locally and, if it still fails, the row is left for
 * durable recovery (logged) with the claim intact.
 *
 * @param checkoutId - Internal pending checkout uuid
 * @param stripeSession - Completed Stripe Checkout Session from the webhook
 * @param claimToken - Fencing token for the paid-fulfilment claim to release
 */
export async function fulfilPaidCheckout(
  checkoutId: string,
  stripeSession: Stripe.Checkout.Session,
  claimToken: string,
): Promise<FulfilPaidCheckoutResult> {
  const pending = await getPendingCheckoutById(checkoutId);
  if (!pending) {
    await releasePendingCheckoutPaidFulfilment(checkoutId, claimToken);
    return { success: false, error: "not_found" };
  }

  if (pending.productConfirmationCode) {
    return {
      success: true,
      checkoutId: pending.id,
      alreadyFulfilled: true,
      productConfirmationCode: pending.productConfirmationCode,
    };
  }

  if (pending.status !== "paid") {
    await releasePendingCheckoutPaidFulfilment(checkoutId, claimToken);
    return { success: false, error: "not_paid" };
  }

  const confirmationCode = pending.bokunConfirmationCode?.trim();
  if (!confirmationCode) {
    await releasePendingCheckoutPaidFulfilment(checkoutId, claimToken);
    return { success: false, error: "missing_reservation" };
  }

  const transactionId = resolveStripeCheckoutTransactionId(stripeSession);
  if (!transactionId) {
    await releasePendingCheckoutPaidFulfilment(checkoutId, claimToken);
    return { success: false, error: "invalid_response" };
  }

  const confirmResult = await confirmReservedBokunCheckout({
    confirmationCode,
    amount: pending.quoteSnapshot.totalAmount,
    currency: pending.quoteSnapshot.currency,
    transactionId,
    sendNotificationToMainContact: true,
  });

  if (!confirmResult.success) {
    // Bókun did not confirm — safe to release so a retry can re-attempt.
    await releasePendingCheckoutPaidFulfilment(checkoutId, claimToken);
    return { success: false, error: confirmResult.error };
  }

  // Post-confirm: the Bókun booking now exists. Never release the claim here —
  // releasing would let a Stripe retry re-run confirmation and double-book.
  const persisted = await persistBokunFulfilment(checkoutId, confirmResult.data);
  if (!persisted) {
    console.error(
      "[fulfil-paid-checkout] Bókun confirmed but persistence failed; needs recovery",
      {
        checkoutId,
        bokunBookingId: confirmResult.data.bokunBookingId,
        productConfirmationCode: confirmResult.data.productConfirmationCode,
      },
    );
    return { success: false, error: "unavailable" };
  }

  return {
    success: true,
    checkoutId: pending.id,
    alreadyFulfilled: false,
    productConfirmationCode: confirmResult.data.productConfirmationCode,
  };
}
