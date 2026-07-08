/**
 * Stripe webhook event idempotency store (LOC-1165 / PRD Task 4.2).
 *
 * Persists processed Stripe `event.id` values so webhook replays do not
 * re-run checkout fulfilment (PRD Task 4.6).
 */

import { CHECKOUT_HANDOFF_TTL_SECONDS } from "@/lib/checkout/handoff-token";
import { getPendingCheckoutRedis } from "@/lib/checkout/pending-checkout-redis";

/** KV key prefix for processed Stripe webhook event ids. */
export const STRIPE_WEBHOOK_EVENT_KEY_PREFIX = "checkout:stripe-event:";

export type MarkStripeWebhookEventProcessedResult =
  | { success: true }
  | { success: false; error: "unavailable" };

/**
 * Builds the KV key for a processed Stripe webhook event id.
 *
 * @param eventId - Stripe event id (e.g. `evt_…`)
 */
export function buildStripeWebhookEventKey(eventId: string): string {
  return `${STRIPE_WEBHOOK_EVENT_KEY_PREFIX}${eventId}`;
}

/**
 * Returns whether a Stripe webhook event id was already processed.
 *
 * @param eventId - Stripe event id from the webhook payload
 */
export async function hasProcessedStripeWebhookEvent(
  eventId: string,
): Promise<boolean> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return false;
  }

  const value = await redis.get(buildStripeWebhookEventKey(eventId));
  return value === "1";
}

/**
 * Marks a Stripe webhook event id as processed.
 *
 * @param eventId - Stripe event id from the webhook payload
 */
export async function markStripeWebhookEventProcessed(
  eventId: string,
): Promise<MarkStripeWebhookEventProcessedResult> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return { success: false, error: "unavailable" };
  }

  await redis.set(buildStripeWebhookEventKey(eventId), "1", {
    ex: CHECKOUT_HANDOFF_TTL_SECONDS,
  });

  return { success: true };
}
