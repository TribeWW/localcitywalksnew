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
  hasProcessedStripeWebhookEvent,
  markStripeWebhookEventProcessed,
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
  if (await hasProcessedStripeWebhookEvent(event.id)) {
    return { success: true, action: "duplicate" };
  }

  if (event.type !== "checkout.session.completed") {
    const markResult = await markStripeWebhookEventProcessed(event.id);
    if (!markResult.success) {
      return { success: false, error: "unavailable" };
    }

    return { success: true, action: "ignored" };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentResult = await handleCheckoutSessionCompleted(session);
  if (!paymentResult.success) {
    return paymentResult;
  }

  const fulfilmentResult = await fulfilPaidCheckout(
    paymentResult.checkoutId,
    session,
  );
  if (!fulfilmentResult.success) {
    return fulfilmentResult;
  }

  const markResult = await markStripeWebhookEventProcessed(event.id);
  if (!markResult.success) {
    return { success: false, error: "unavailable" };
  }

  return {
    success: true,
    action: "checkout_paid",
    checkoutId: paymentResult.checkoutId,
    alreadyPaid: paymentResult.alreadyPaid,
    productConfirmationCode: fulfilmentResult.productConfirmationCode,
  };
}
