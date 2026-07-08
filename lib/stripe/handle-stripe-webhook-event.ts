/**
 * Stripe webhook event dispatcher (LOC-1165 / PRD Task 4.2).
 *
 * Applies Stripe event-id idempotency, routes `checkout.session.completed`
 * to payment confirmation + Bókun fulfilment (LOC-1166), and acknowledges
 * other event types.
 */

import type Stripe from "stripe";

import { fulfilPaidCheckout } from "@/lib/checkout/fulfil-paid-checkout";
import { handleCheckoutSessionCompleted } from "@/lib/checkout/handle-checkout-session-completed";
import {
  claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim,
} from "@/lib/stripe/stripe-webhook-idempotency";

export type HandleStripeWebhookEventResult =
  | {
      success: true;
      action: "duplicate" | "ignored" | "checkout_paid";
      checkoutId?: string;
      alreadyPaid?: boolean;
      productConfirmationCode?: string;
    }
  | {
      success: false;
      error:
        | "invalid_session"
        | "not_found"
        | "unavailable"
        | "conflict"
        | "not_paid"
        | "missing_reservation"
        | "confirm_failed"
        | "invalid_response";
    };

/**
 * Processes a verified Stripe webhook event.
 *
 * @param event - Verified Stripe event from signature construction
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<HandleStripeWebhookEventResult> {
  // Atomically claim the event id before any fulfilment work so duplicate
  // deliveries of the same event cannot both reach Bókun.
  const claim = await claimStripeWebhookEvent(event.id);
  if (!claim.success) {
    return { success: false, error: "unavailable" };
  }

  if (claim.outcome === "duplicate") {
    return { success: true, action: "duplicate" };
  }

  if (event.type !== "checkout.session.completed") {
    return { success: true, action: "ignored" };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentResult = await handleCheckoutSessionCompleted(session);
  if (!paymentResult.success) {
    // Release the claim so Stripe's retry can re-attempt this event.
    await releaseStripeWebhookEventClaim(event.id);
    return paymentResult;
  }

  // Only the delivery that won the atomic claim advances to Bókun fulfilment;
  // a concurrent loser acknowledges without re-confirming the reservation.
  if (!paymentResult.shouldFulfil) {
    return {
      success: true,
      action: "checkout_paid",
      checkoutId: paymentResult.checkoutId,
      alreadyPaid: paymentResult.alreadyPaid,
      productConfirmationCode: paymentResult.productConfirmationCode,
    };
  }

  const fulfilmentResult = await fulfilPaidCheckout(
    paymentResult.checkoutId,
    session,
    paymentResult.claimToken,
  );
  if (!fulfilmentResult.success) {
    await releaseStripeWebhookEventClaim(event.id);
    return fulfilmentResult;
  }

  return {
    success: true,
    action: "checkout_paid",
    checkoutId: paymentResult.checkoutId,
    alreadyPaid: paymentResult.alreadyPaid,
    productConfirmationCode: fulfilmentResult.productConfirmationCode,
  };
}
