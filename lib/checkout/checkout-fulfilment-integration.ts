/**
 * Builds a paid Checkout Session payload for fulfilment integration tests (LOC-1169).
 *
 * Hosted Checkout does not expose a PaymentIntent until the customer opens the
 * hosted page in a browser. Integration tests therefore confirm a standalone
 * test PaymentIntent and merge it onto the real session for webhook fulfilment.
 */

import type Stripe from "stripe";

import {
  confirmStripeTestPaymentIntent,
  extractStripeCheckoutPaymentIntentId,
} from "@/lib/checkout/complete-stripe-test-checkout-session";

/**
 * Resolves the amount total for a Checkout Session from session fields or line items.
 *
 * @param stripe - Stripe SDK client
 * @param session - Open Checkout Session
 */
export async function resolveStripeCheckoutSessionAmountTotal(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<number> {
  if (typeof session.amount_total === "number") {
    return session.amount_total;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
  });
  const amount = lineItems.data[0]?.amount_total;
  if (typeof amount !== "number") {
    throw new Error(
      `Checkout session ${session.id} is missing amount_total for test payment`,
    );
  }

  return amount;
}

/**
 * Confirms a test PaymentIntent for a hosted Checkout Session and returns a paid
 * session-shaped object for webhook fulfilment.
 *
 * @param stripe - Stripe SDK client (test secret key)
 * @param sessionId - Hosted Checkout Session id (`cs_test_…`)
 */
export async function buildPaidCheckoutSessionForFulfilmentIntegration(
  stripe: Stripe,
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const trimmedSessionId = sessionId.trim();
  if (!trimmedSessionId) {
    throw new Error("Stripe Checkout Session id is required");
  }

  const session = await stripe.checkout.sessions.retrieve(trimmedSessionId, {
    expand: ["payment_intent"],
  });

  if (session.payment_status === "paid") {
    return session;
  }

  let paymentIntentId = extractStripeCheckoutPaymentIntentId(
    session.payment_intent,
  );

  if (!paymentIntentId) {
    const currency = session.currency;
    if (!currency) {
      throw new Error(
        `Checkout session ${trimmedSessionId} is missing currency for test payment`,
      );
    }

    const amount = await resolveStripeCheckoutSessionAmountTotal(stripe, session);
    const checkoutId = session.metadata?.checkoutId?.trim();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: checkoutId ? { checkoutId } : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    paymentIntentId = paymentIntent.id;
  }

  await confirmStripeTestPaymentIntent(stripe, paymentIntentId);

  return {
    ...session,
    payment_status: "paid",
    payment_intent: paymentIntentId,
  } as Stripe.Checkout.Session;
}

/**
 * Asserts KV fulfilment fields required for the checkout success page.
 *
 * When the Stripe session is still `unpaid` in the API (hosted Checkout without
 * a browser), this verifies the same prerequisites `loadCheckoutSuccess` needs
 * besides live Stripe payment verification.
 *
 * @param sessionId - Stripe Checkout Session id
 */
export async function assertCheckoutFulfilmentReadyForSuccessPage(
  sessionId: string,
): Promise<{
  bookingReference: string;
  stripeVerifiedPaid: boolean;
}> {
  const { getPendingCheckoutByStripeSessionId } =
    await import("@/lib/checkout/pending-checkout-store");
  const { loadCheckoutSuccess } =
    await import("@/lib/checkout/load-checkout-success");
  const { retrievePaidStripeCheckoutSession } =
    await import("@/lib/stripe/retrieve-paid-checkout-session");

  const pending = await getPendingCheckoutByStripeSessionId(sessionId);
  const bookingReference = pending?.productConfirmationCode?.trim();
  if (!bookingReference || pending?.status !== "paid") {
    throw new Error(
      `Pending checkout is not fulfilment-ready for session ${sessionId}`,
    );
  }

  const stripeResult = await retrievePaidStripeCheckoutSession(sessionId);
  if (stripeResult.success) {
    const success = await loadCheckoutSuccess(sessionId);
    if (success.status !== "ready" || success.bookingReference !== bookingReference) {
      throw new Error(
        `Expected success page ready state for session ${sessionId}`,
      );
    }

    return { bookingReference, stripeVerifiedPaid: true };
  }

  return { bookingReference, stripeVerifiedPaid: false };
}
