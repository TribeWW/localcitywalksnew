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

/**
 * Confirms a paid pending checkout with Bókun and stores fulfilment fields.
 *
 * @param checkoutId - Internal pending checkout uuid
 * @param stripeSession - Completed Stripe Checkout Session from the webhook
 */
export async function fulfilPaidCheckout(
  checkoutId: string,
  stripeSession: Stripe.Checkout.Session,
): Promise<FulfilPaidCheckoutResult> {
  const pending = await getPendingCheckoutById(checkoutId);
  if (!pending) {
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
    return { success: false, error: "not_paid" };
  }

  const confirmationCode = pending.bokunConfirmationCode?.trim();
  if (!confirmationCode) {
    return { success: false, error: "missing_reservation" };
  }

  const transactionId = resolveStripeCheckoutTransactionId(stripeSession);
  if (!transactionId) {
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
    return { success: false, error: confirmResult.error };
  }

  const updateResult = await updatePendingCheckout(checkoutId, {
    bokunBookingId: confirmResult.data.bokunBookingId,
    productConfirmationCode: confirmResult.data.productConfirmationCode,
  });

  if (!updateResult.success) {
    if (updateResult.error === "unavailable") {
      return { success: false, error: "unavailable" };
    }

    return { success: false, error: "not_found" };
  }

  return {
    success: true,
    checkoutId: pending.id,
    alreadyFulfilled: false,
    productConfirmationCode: confirmResult.data.productConfirmationCode,
  };
}
