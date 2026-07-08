/**
 * Verifies Stripe webhook signatures (LOC-1176 / PRD Task 4.1).
 *
 * Used by the webhook route (LOC-1165) before fulfilment. Returns structured
 * errors so callers can map to HTTP responses without throwing.
 */

import Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/stripe/stripe-env";

export type ConstructStripeWebhookEventResult =
  | { success: true; event: Stripe.Event }
  | {
      success: false;
      error: "unconfigured" | "missing_signature" | "invalid_signature";
    };

/**
 * Constructs a verified Stripe event from the raw webhook body and signature.
 *
 * @param payload - Raw request body (string or Buffer)
 * @param signature - Value of the `stripe-signature` header
 */
export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string | null | undefined,
): ConstructStripeWebhookEventResult {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return { success: false, error: "unconfigured" };
  }

  const trimmedSignature = signature?.trim();
  if (!trimmedSignature) {
    return { success: false, error: "missing_signature" };
  }

  try {
    const event = Stripe.webhooks.constructEvent(
      payload,
      trimmedSignature,
      webhookSecret,
    );

    return { success: true, event };
  } catch {
    return { success: false, error: "invalid_signature" };
  }
}
