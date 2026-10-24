/**
 * Stripe webhook event dispatcher (LOC-1165 / PRD Task 4.2).
 *
 * Applies Stripe event-id idempotency, routes `checkout.session.completed`
 * to payment confirmation + Bókun fulfilment (LOC-1166), and acknowledges
 * other event types.
 */

import { SeverityNumber } from "@opentelemetry/api-logs";
import type Stripe from "stripe";

import {
  flushPostHogLogs,
  posthogIntegrationLogger,
} from "@/instrumentation";
import { fulfilPaidCheckout } from "@/lib/checkout/fulfil-paid-checkout";
import { handleCheckoutSessionCompleted } from "@/lib/checkout/handle-checkout-session-completed";
import { getPostHogClient } from "@/lib/posthog-server";
import { recordPaidFulfilmentFailure } from "@/lib/checkout/pending-checkout-store";
import {
  claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim,
} from "@/lib/stripe/stripe-webhook-idempotency";

/** Cap each telemetry flush so a stall cannot hold the webhook acknowledgement. */
const WEBHOOK_TELEMETRY_FLUSH_TIMEOUT_MS = 1_000;

/**
 * Awaits a telemetry flush without letting it reject or wait without a bound.
 */
async function flushWebhookTelemetry(flush: Promise<unknown>): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      flush,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("telemetry flush timed out"));
        }, WEBHOOK_TELEMETRY_FLUSH_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.warn(
      "[stripe-webhook] telemetry flush failed",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function captureCheckoutPaymentCompleted(
  checkoutId: string,
  alreadyPaid: boolean,
): Promise<void> {
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: checkoutId,
      event: "checkout_payment_completed",
      properties: { already_paid: alreadyPaid },
    });
    await flushWebhookTelemetry(posthog.flush());
  }

  posthogIntegrationLogger.emit({
    body: "Checkout payment fulfilled",
    severityNumber: SeverityNumber.INFO,
    attributes: {
      event: "checkout_payment_fulfilled",
      checkout_id: checkoutId,
      already_paid: alreadyPaid,
    },
  });
  await flushWebhookTelemetry(flushPostHogLogs());
}

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
        | "paid_unfulfilled"
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
    await captureCheckoutPaymentCompleted(
      paymentResult.checkoutId,
      paymentResult.alreadyPaid,
    );
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
    if (fulfilmentResult.error === "confirm_failed") {
      const recorded = await recordPaidFulfilmentFailure(
        paymentResult.checkoutId,
        fulfilmentResult.error,
      );

      if (recorded.success && recorded.exhausted) {
        console.error("[stripe-webhook] paid-but-unfulfilled — ops escalation:", {
          checkoutId: paymentResult.checkoutId,
          attemptCount: recorded.attemptCount,
        });
        // Do not release the Stripe event claim: we are intentionally
        // acknowledging and stopping retries after exhausting attempts.
        return { success: false, error: "paid_unfulfilled" };
      }
    }

    // Release the claim so Stripe's retry can re-attempt this event.
    await releaseStripeWebhookEventClaim(event.id);
    return fulfilmentResult;
  }

  await captureCheckoutPaymentCompleted(
    paymentResult.checkoutId,
    paymentResult.alreadyPaid,
  );

  return {
    success: true,
    action: "checkout_paid",
    checkoutId: paymentResult.checkoutId,
    alreadyPaid: paymentResult.alreadyPaid,
    productConfirmationCode: fulfilmentResult.productConfirmationCode,
  };
}
