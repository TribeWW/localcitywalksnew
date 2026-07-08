/**
 * Stripe webhook event idempotency store (LOC-1165 / PRD Task 4.2).
 *
 * Claims each Stripe `event.id` with a single atomic `SET … NX EX` before any
 * fulfilment work so concurrent duplicate deliveries of the same event cannot
 * both reach Bókun (PRD Task 4.6). The claim is released on transient failure
 * so Stripe's automatic retries can re-attempt fulfilment.
 */

import { getPendingCheckoutRedis } from "@/lib/checkout/pending-checkout-redis";

/** KV key prefix for processed Stripe webhook event ids. */
export const STRIPE_WEBHOOK_EVENT_KEY_PREFIX = "checkout:stripe-event:";

/**
 * TTL for a claimed Stripe webhook event id.
 *
 * Must outlive Stripe's automatic retry window (up to ~3 days) so
 * a late redelivery of an already-processed event is still deduplicated. Kept
 * independent of the checkout handoff TTL, which tracks a different lifecycle.
 */
// Slightly longer than Stripe's ~3-day retry window to survive a late redelivery.
export const STRIPE_WEBHOOK_EVENT_TTL_SECONDS = 4 * 24 * 60 * 60;
export type ClaimStripeWebhookEventResult =
  | { success: true; outcome: "claimed" | "duplicate" }
  | { success: false; error: "unavailable" };

/**
 * Builds the KV key for a Stripe webhook event id.
 *
 * @param eventId - Stripe event id (e.g. `evt_…`)
 */
export function buildStripeWebhookEventKey(eventId: string): string {
  return `${STRIPE_WEBHOOK_EVENT_KEY_PREFIX}${eventId}`;
}

/**
 * Atomically claims a Stripe webhook event id before fulfilment.
 *
 * Uses `SET … NX EX` so exactly one delivery of a given `event.id` wins the
 * claim (`outcome: "claimed"`); concurrent or later duplicates observe
 * `outcome: "duplicate"` and must not run fulfilment.
 *
 * @param eventId - Stripe event id from the webhook payload
 */
export async function claimStripeWebhookEvent(
  eventId: string,
): Promise<ClaimStripeWebhookEventResult> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return { success: false, error: "unavailable" };
  }

  const claimed = await redis.set(buildStripeWebhookEventKey(eventId), "1", {
    nx: true,
    ex: STRIPE_WEBHOOK_EVENT_TTL_SECONDS,
  });

  return {
    success: true,
    outcome: claimed === "OK" ? "claimed" : "duplicate",
  };
}

/**
 * Releases a Stripe webhook event claim so Stripe retries can re-attempt.
 *
 * Called after a transient fulfilment failure; a no-op when Redis is
 * unconfigured (the retry will simply re-claim).
 *
 * @param eventId - Stripe event id from the webhook payload
 */
export async function releaseStripeWebhookEventClaim(
  eventId: string,
): Promise<void> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return;
  }

  await redis.del(buildStripeWebhookEventKey(eventId));
}
