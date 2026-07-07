/**
 * Runs checkout Pay initiation against Bókun test `15686` + Stripe test keys.
 *
 * Usage:
 *   npm run integration:checkout:pay *
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
import { getPendingCheckoutById, getPendingCheckoutByStripeSessionId } from "@/lib/checkout/pending-checkout-store";
import { getStripeClient } from "@/lib/stripe/stripe-client";

/**
 * Resolves checkout id for integration cleanup after Pay initiation.
 *
 * Prefers the KV stripe-session index so cleanup still works when Stripe API
 * calls fail after a session was created.
 */
async function resolveCheckoutIdForCleanup(
  redirectUrl: string,
): Promise<string | null> {
  const sessionId = extractStripeCheckoutSessionId(redirectUrl);
  if (!sessionId) {
    return null;
  }

  const pending = await getPendingCheckoutByStripeSessionId(sessionId);
  if (pending?.id) {
    return pending.id;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.metadata?.checkoutId ?? null;
  } catch {
    return null;
  }
}

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

  let redirectUrl: string | null = null;
  let exitCode = 0;

  try {
    const result = await executeInitiateCheckoutPayment(context.paymentInput);
    if (!result.success) {
      console.error("Pay initiation failed:", result.error);
      exitCode = 1;
      return;
    }

    redirectUrl = result.redirectUrl;
    console.log("Stripe redirect:", redirectUrl);

    const sessionId = extractStripeCheckoutSessionId(redirectUrl);
    if (!sessionId) {
      console.error("Could not parse Stripe session id from redirect URL");
      exitCode = 1;
      return;
    }

    const stripe = getStripeClient();
    if (!stripe) {
      console.error("Stripe client unavailable");
      exitCode = 1;
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const checkoutId = session.metadata?.checkoutId;
    if (!checkoutId) {
      console.error("Stripe session missing metadata.checkoutId");
      exitCode = 1;
      return;
    }

    const pending = await getPendingCheckoutById(checkoutId);
    console.log("KV pending row:", {
      id: pending?.id,
      status: pending?.status,
      bokunConfirmationCode: pending?.bokunConfirmationCode,
      stripeSessionId: pending?.stripeSessionId,
    });

    console.log("Integration run complete.");
  } finally {
    if (redirectUrl) {
      try {
        const checkoutId = await resolveCheckoutIdForCleanup(redirectUrl);
        if (checkoutId) {
          const cleanup = await handleStripeCheckoutCancel(checkoutId);
          console.log("Cleanup:", cleanup);
        } else {
          console.error(
            "Cleanup skipped: could not resolve checkout id from redirect URL",
          );
        }
      } catch (error) {
        console.error(
          "[integration:checkout:pay] cleanup failed:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
