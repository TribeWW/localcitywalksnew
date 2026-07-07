/**
 * Runs checkout Pay initiation against Bókun test `15686` + Stripe test keys.
 *
 * Usage:
 *   npm run test:integration:checkout
 *
 * Requires `.env.local` with Bókun test, KV, handoff secret, and Stripe test env.
 * See `documentation/implementation-plans/checklists/2026-07-07-checkout-pay-initiation-integration-checklist.md`.
 */

import {
  getMissingCheckoutPayIntegrationEnvVars,
  isCheckoutPayIntegrationEnabled,
} from "@/lib/checkout/checkout-pay-integration-env";
import { resolveCheckoutPayIntegrationContext } from "@/lib/checkout/resolve-checkout-pay-integration-context";
import { extractStripeCheckoutSessionId } from "@/lib/checkout/extract-stripe-checkout-session-id";
import { handleStripeCheckoutCancel } from "@/lib/checkout/handle-stripe-checkout-cancel";
import { executeInitiateCheckoutPayment } from "@/lib/checkout/initiate-checkout-payment";
import { getPendingCheckoutById } from "@/lib/checkout/pending-checkout-store";
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

  const result = await executeInitiateCheckoutPayment(context.paymentInput);
  if (!result.success) {
    console.error("Pay initiation failed:", result.error);
    process.exit(1);
  }

  console.log("Stripe redirect:", result.redirectUrl);

  const sessionId = extractStripeCheckoutSessionId(result.redirectUrl);
  if (!sessionId) {
    console.error("Could not parse Stripe session id from redirect URL");
    process.exit(1);
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error("Stripe client unavailable");
    process.exit(1);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const checkoutId = session.metadata?.checkoutId;
  if (!checkoutId) {
    console.error("Stripe session missing metadata.checkoutId");
    process.exit(1);
  }

  const pending = await getPendingCheckoutById(checkoutId);
  console.log("KV pending row:", {
    id: pending?.id,
    status: pending?.status,
    bokunConfirmationCode: pending?.bokunConfirmationCode,
    stripeSessionId: pending?.stripeSessionId,
  });

  const cleanup = await handleStripeCheckoutCancel(checkoutId);
  console.log("Cleanup:", cleanup);

  console.log("Integration run complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
