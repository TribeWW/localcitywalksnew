/**
 * Runs checkout fulfilment E2E against Bókun test `15686` + Stripe test keys.
 *
 * Usage:
 *   npm run integration:checkout:fulfilment
 *
 * Requires `.env.local` with Bókun test, KV, handoff secret, and Stripe test env.
 * Set `RUN_CHECKOUT_INTEGRATION_TESTS=true`.
 */

import "./load-local-env.mjs";

import {
  getMissingCheckoutPayIntegrationEnvVars,
  isCheckoutPayIntegrationEnabled,
} from "@/lib/checkout/checkout-pay-integration-env";
import { buildCheckoutSessionCompletedEvent } from "@/lib/checkout/build-checkout-session-completed-event";
import {
  assertCheckoutFulfilmentReadyForSuccessPage,
  buildPaidCheckoutSessionForFulfilmentIntegration,
} from "@/lib/checkout/checkout-fulfilment-integration";
import { extractStripeCheckoutSessionId } from "@/lib/checkout/extract-stripe-checkout-session-id";
import { executeInitiateCheckoutPayment } from "@/lib/checkout/initiate-checkout-payment";
import { getPendingCheckoutById } from "@/lib/checkout/pending-checkout-store";
import { resolveCheckoutPayIntegrationContext } from "@/lib/checkout/resolve-checkout-pay-integration-context";
import { handleStripeWebhookEvent } from "@/lib/stripe/handle-stripe-webhook-event";
import { getStripeClient } from "@/lib/stripe/stripe-client";

async function main(): Promise<void> {
  if (!isCheckoutPayIntegrationEnabled()) {
    console.error(
      "Set RUN_CHECKOUT_INTEGRATION_TESTS=true to run this script.",
    );
    process.exit(1);
  }

  const missing = getMissingCheckoutPayIntegrationEnvVars();
  if (missing.length > 0) {
    console.error("Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  const context = await resolveCheckoutPayIntegrationContext();
  console.log("Slot:", context.slot);

  const payResult = await executeInitiateCheckoutPayment(context.paymentInput);
  if (!payResult.success) {
    console.error("Pay initiation failed:", payResult.error);
    process.exit(1);
  }

  console.log("Stripe redirect:", payResult.redirectUrl);

  const sessionId = extractStripeCheckoutSessionId(payResult.redirectUrl);
  if (!sessionId) {
    console.error("Could not parse Stripe session id from redirect URL");
    process.exit(1);
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error("Stripe client unavailable");
    process.exit(1);
  }

  const paidSession = await buildPaidCheckoutSessionForFulfilmentIntegration(
    stripe,
    sessionId,
  );
  const checkoutId = paidSession.metadata?.checkoutId;
  if (!checkoutId) {
    console.error("Stripe session missing metadata.checkoutId");
    process.exit(1);
  }

  const webhookResult = await handleStripeWebhookEvent(
    buildCheckoutSessionCompletedEvent(paidSession),
  );
  if (!webhookResult.success) {
    console.error("Webhook fulfilment failed:", webhookResult.error);
    process.exit(1);
  }

  const pending = await getPendingCheckoutById(checkoutId);
  const success = await assertCheckoutFulfilmentReadyForSuccessPage(sessionId);

  console.log("KV pending row:", {
    id: pending?.id,
    status: pending?.status,
    bokunConfirmationCode: pending?.bokunConfirmationCode,
    productConfirmationCode: pending?.productConfirmationCode,
    stripeSessionId: pending?.stripeSessionId,
  });
  console.log("Success page readiness:", success);

  if (!success.bookingReference) {
    console.error("Expected fulfilment-ready booking reference");
    process.exit(1);
  }

  console.log("Fulfilment integration run complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
