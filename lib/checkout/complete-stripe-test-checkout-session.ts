/**
 * Completes a Stripe Checkout Session in test mode (LOC-1169 / PRD Task 4.6).
 *
 * Hosted Checkout cannot be automated in a browser, so integration tests confirm
 * the underlying PaymentIntent with Stripe test payment methods, then poll until
 * `payment_status` is `paid`.
 */

import type Stripe from "stripe";

/** Poll interval while waiting for Checkout Session to become paid. */
export const STRIPE_TEST_CHECKOUT_PAID_POLL_MS = 500;

/** Maximum poll attempts before failing the integration run. */
export const STRIPE_TEST_CHECKOUT_PAID_MAX_ATTEMPTS = 40;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves a PaymentIntent id from a Checkout Session expand field.
 *
 * @param paymentIntent - String id or expanded PaymentIntent from Stripe
 */
export function extractStripeCheckoutPaymentIntentId(
  paymentIntent: Stripe.Checkout.Session["payment_intent"],
): string | null {
  if (typeof paymentIntent === "string") {
    const trimmed = paymentIntent.trim();
    return trimmed || null;
  }

  if (
    paymentIntent &&
    typeof paymentIntent === "object" &&
    typeof paymentIntent.id === "string"
  ) {
    const trimmed = paymentIntent.id.trim();
    return trimmed || null;
  }

  return null;
}

/**
 * Confirms a test PaymentIntent when it is not already succeeded.
 *
 * @param stripe - Stripe SDK client (test secret key)
 * @param paymentIntentId - PaymentIntent attached to the Checkout Session
 */
export async function confirmStripeTestPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<void> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status === "succeeded") {
    return;
  }

  try {
    await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
      return_url: "https://example.com/checkout/success",
    });
    return;
  } catch (primaryError) {
    const message =
      primaryError instanceof Error ? primaryError.message : String(primaryError);
    console.warn(
      `[stripe-test-checkout] pm_card_visa confirm failed for ${paymentIntentId}: ${message}`,
    );
  }

  await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method_data: {
      type: "card",
      card: { token: "tok_visa" },
    },
    return_url: "https://example.com/checkout/success",
  });
}

/**
 * Pays an open Stripe Checkout Session using test-mode PaymentIntent confirm.
 *
 * @param stripe - Stripe SDK client (test secret key)
 * @param sessionId - Hosted Checkout Session id (`cs_test_…`)
 */
export async function completeStripeTestCheckoutSession(
  stripe: Stripe,
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const trimmedSessionId = sessionId.trim();
  if (!trimmedSessionId) {
    throw new Error("Stripe Checkout Session id is required");
  }

  const initial = await stripe.checkout.sessions.retrieve(trimmedSessionId, {
    expand: ["payment_intent"],
  });

  if (initial.payment_status === "paid") {
    return initial;
  }

  let paymentIntentId = extractStripeCheckoutPaymentIntentId(
    initial.payment_intent,
  );
  if (!paymentIntentId) {
    const checkoutId = initial.metadata?.checkoutId?.trim();
    if (checkoutId) {
      const search = await stripe.paymentIntents.search({
        query: `metadata['checkoutId']:'${checkoutId}'`,
        limit: 1,
      });
      paymentIntentId = search.data[0]?.id ?? null;
    }
  }

  if (!paymentIntentId) {
    throw new Error(
      `Checkout session ${trimmedSessionId} has no payment_intent — cannot complete in test mode`,
    );
  }

  await confirmStripeTestPaymentIntent(stripe, paymentIntentId);

  for (let attempt = 0; attempt < STRIPE_TEST_CHECKOUT_PAID_MAX_ATTEMPTS; attempt += 1) {
    const updated = await stripe.checkout.sessions.retrieve(trimmedSessionId);
    if (updated.payment_status === "paid") {
      return updated;
    }

    await sleep(STRIPE_TEST_CHECKOUT_PAID_POLL_MS);
  }

  throw new Error(
    `Checkout session ${trimmedSessionId} did not reach paid status after test payment`,
  );
}
