/**
 * Stripe webhook HTTP request processor (LOC-1165 / PRD Task 4.2).
 *
 * Verifies the signature, dispatches the event, and maps outcomes to HTTP
 * status codes for Stripe delivery retries.
 */

import { constructStripeWebhookEvent } from "@/lib/stripe/construct-stripe-webhook-event";
import { handleStripeWebhookEvent } from "@/lib/stripe/handle-stripe-webhook-event";

export type ProcessStripeWebhookRequestResult = {
  status: number;
  body: { received: true } | { error: string };
};

/**
 * Processes a raw Stripe webhook POST body and signature header.
 *
 * @param payload - Raw request body from the webhook route
 * @param signature - `stripe-signature` header value
 */
export async function processStripeWebhookRequest(
  payload: string | Buffer,
  signature: string | null | undefined,
): Promise<ProcessStripeWebhookRequestResult> {
  const verification = constructStripeWebhookEvent(payload, signature);
  if (!verification.success) {
    if (
      verification.error === "missing_signature" ||
      verification.error === "invalid_signature"
    ) {
      return { status: 400, body: { error: verification.error } };
    }

    return { status: 500, body: { error: verification.error } };
  }

  const handled = await handleStripeWebhookEvent(verification.event);
  if (!handled.success) {
    // A conflict means the checkout is already in a terminal state; retrying
    // cannot recover it, so acknowledge (200) rather than triggering retries.
    if (handled.error === "conflict") {
      console.error("[stripe-webhook] conflict — checkout already terminal:", {
        eventId: verification.event.id,
        type: verification.event.type,
      });
      return { status: 200, body: { received: true } };
    }

    if (handled.error === "paid_unfulfilled") {
      console.error("[stripe-webhook] paid-but-unfulfilled — manual recovery needed:", {
        eventId: verification.event.id,
        type: verification.event.type,
      });
      return { status: 200, body: { received: true } };
    }

    // Stripe retries on non-2xx responses. Only return 500 for errors that are
    // likely transient (infra / concurrency / upstream). For terminal errors,
    // log and acknowledge so Stripe does not replay indefinitely.
    const transientErrors = new Set(["unavailable", "confirm_failed"]);
    if (transientErrors.has(handled.error)) {
      return { status: 500, body: { error: handled.error } };
    }

    console.error("[stripe-webhook] terminal event failure:", {
      eventId: verification.event.id,
      type: verification.event.type,
      error: handled.error,
    });

    return { status: 200, body: { received: true } };
  }

  return { status: 200, body: { received: true } };
}
