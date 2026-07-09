/**
 * Retrieves and validates a paid Stripe Checkout Session (LOC-1167 / PRD Task 4.3).
 *
 * Success page must never trust client-only flags — payment status is verified
 * server-side via the Stripe API before showing a booking reference.
 */

import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/stripe-client";

export type RetrievePaidStripeCheckoutSessionResult =
  | { success: true; session: Stripe.Checkout.Session }
  | { success: false; error: "unavailable" | "not_found" | "unpaid" };

/**
 * Loads a Stripe Checkout Session and ensures payment completed successfully.
 *
 * @param sessionId - `session_id` query param from `/checkout/success`
 */
export async function retrievePaidStripeCheckoutSession(
  sessionId: string,
): Promise<RetrievePaidStripeCheckoutSessionResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { success: false, error: "unavailable" };
  }

  const trimmedId = sessionId.trim();
  if (!trimmedId) {
    return { success: false, error: "not_found" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(trimmedId);

    if (session.payment_status !== "paid") {
      return { success: false, error: "unpaid" };
    }

    return { success: true, session };
  } catch (error) {
    const stripeError = error as { code?: string; statusCode?: number };
    if (stripeError.code === "resource_missing" || stripeError.statusCode === 404) {
      return { success: false, error: "not_found" };
    }

    console.error(
      `[stripe] failed to retrieve checkout session ${trimmedId}:`,
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error: "unavailable" };
  }
}
