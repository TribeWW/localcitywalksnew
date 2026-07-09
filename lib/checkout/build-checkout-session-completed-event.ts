/**
 * Builds a Stripe `checkout.session.completed` event for integration tests (LOC-1169).
 *
 * Used to drive `handleStripeWebhookEvent` after a real test-mode Checkout Session
 * is paid, without requiring the Stripe CLI or a public webhook URL.
 */

import { randomUUID } from "node:crypto";

import type Stripe from "stripe";

/**
 * Builds a synthetic webhook event wrapping a paid Checkout Session.
 *
 * @param session - Paid session retrieved from the Stripe API
 * @param eventId - Optional fixed event id (defaults to a unique integration id)
 */
export function buildCheckoutSessionCompletedEvent(
  session: Stripe.Checkout.Session,
  eventId?: string,
): Stripe.Event {
  const id = eventId?.trim() || `evt_integration_${randomUUID()}`;

  // Stripe's SDK event types are strict unions (e.g. CheckoutSessionCompletedEvent)
  // that don't accept `previous_attributes: null`. For integration tests we only
  // need a correctly-shaped payload for our handler, so we cast via `unknown`.
  return {
    id,
    object: "event",
    api_version: null,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: session,
      previous_attributes: undefined,
    },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
  } as unknown as Stripe.Event;
}
