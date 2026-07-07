// @vitest-environment node
/**
 * initiateCheckoutPayment — live integration specs (LOC-1164 / PRD Task 3.6).
 *
 * Opt-in via `RUN_CHECKOUT_INTEGRATION_TESTS=true` with Bókun test product
 * `15686`, Upstash KV, and Stripe test keys. See manual checklist:
 * `documentation/implementation-plans/checklists/2026-07-07-checkout-pay-initiation-integration-checklist.md`
 *
 * Uses dynamic imports so unit `npm test` and skipped runs do not require Bókun env.
 */

import { describe, expect, it } from "vitest";
import {
  getMissingCheckoutPayIntegrationEnvVars,
  isCheckoutPayIntegrationEnabled,
  shouldRunCheckoutPayIntegrationTests,
} from "@/lib/checkout/checkout-pay-integration-env";

const runLive = shouldRunCheckoutPayIntegrationTests();

describe("initiateCheckoutPayment — live integration (LOC-1164)", () => {
  if (!runLive) {
    it.skip("skipped — enable RUN_CHECKOUT_INTEGRATION_TESTS=true with full env (see checkout pay integration checklist)", () => {});
    return;
  }

  it("reserves in Bókun, persists KV pending, and returns Stripe Checkout redirect", async () => {
    const { resolveCheckoutPayIntegrationContext } =
      await import("@/lib/checkout/resolve-checkout-pay-integration-context");
    const { executeInitiateCheckoutPayment } =
      await import("@/lib/checkout/initiate-checkout-payment");
    const { extractStripeCheckoutSessionId } =
      await import("@/lib/checkout/extract-stripe-checkout-session-id");
    const { handleStripeCheckoutCancel } =
      await import("@/lib/checkout/handle-stripe-checkout-cancel");
    const { getPendingCheckoutById } =
      await import("@/lib/checkout/pending-checkout-store");
    const { getStripeClient } = await import("@/lib/stripe/stripe-client");

    const context = await resolveCheckoutPayIntegrationContext();
    const result = await executeInitiateCheckoutPayment(context.paymentInput);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.redirectUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);

    const sessionId = extractStripeCheckoutSessionId(result.redirectUrl);
    expect(sessionId).toBeTruthy();

    const stripe = getStripeClient();
    expect(stripe).not.toBeNull();

    const session = await stripe!.checkout.sessions.retrieve(sessionId!);
    const checkoutId = session.metadata?.checkoutId;
    expect(checkoutId).toBeTruthy();
    try {
      expect(session.amount_total).toBe(
        Math.round(context.paymentInput.clientQuote.totalAmount * 100),
      );

      const pending = await getPendingCheckoutById(checkoutId!);
      expect(pending?.status).toBe("pending");
      expect(pending?.bokunConfirmationCode).toBeTruthy();
      expect(pending?.stripeSessionId).toBe(sessionId);
    } finally {
      const cleanup = await handleStripeCheckoutCancel(checkoutId!);
      expect(cleanup.success).toBe(true);

      const cleaned = await getPendingCheckoutById(checkoutId!);
      expect(cleaned?.status).toBe("failed");
    }
  }, 120_000);
});

describe("initiateCheckoutPayment — live integration prerequisites", () => {
  it("documents missing env when flag is set but credentials are incomplete", () => {
    if (!isCheckoutPayIntegrationEnabled()) {
      return;
    }

    const missing = getMissingCheckoutPayIntegrationEnvVars();
    expect(missing).toEqual([]);
  });
});
