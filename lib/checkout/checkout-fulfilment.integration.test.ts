// @vitest-environment node
/**
 * Checkout fulfilment — live integration specs (LOC-1169 / PRD Task 4.6).
 *
 * End-to-end: booking-widget handoff → Pay click → Stripe test payment →
 * webhook fulfilment → success page with Bókun product confirmation code.
 *
 * Opt-in via `RUN_CHECKOUT_INTEGRATION_TESTS=true` with Bókun test product
 * `15686`, Upstash KV, and Stripe test keys (same gate as LOC-1164).
 */

import { describe, expect, it } from "vitest";
import {
  getMissingCheckoutPayIntegrationEnvVars,
  isCheckoutPayIntegrationEnabled,
  shouldRunCheckoutPayIntegrationTests,
} from "@/lib/checkout/checkout-pay-integration-env";

const runLive = shouldRunCheckoutPayIntegrationTests();

describe("checkout fulfilment — live integration (LOC-1169)", () => {
  if (!runLive) {
    it.skip(
      "skipped — enable RUN_CHECKOUT_INTEGRATION_TESTS=true with full env (see checkout pay integration checklist)",
      () => {},
    );
    return;
  }

  it("fulfils widget → checkout → Stripe payment → success page + Bókun confirmation", async () => {
    const { buildCheckoutSessionCompletedEvent } =
      await import("@/lib/checkout/build-checkout-session-completed-event");
    const {
      assertCheckoutFulfilmentReadyForSuccessPage,
      buildPaidCheckoutSessionForFulfilmentIntegration,
    } = await import("@/lib/checkout/checkout-fulfilment-integration");
    const { extractStripeCheckoutSessionId } =
      await import("@/lib/checkout/extract-stripe-checkout-session-id");
    const { executeInitiateCheckoutPayment } =
      await import("@/lib/checkout/initiate-checkout-payment");
    const { getPendingCheckoutById } =
      await import("@/lib/checkout/pending-checkout-store");
    const { resolveCheckoutPayIntegrationContext } =
      await import("@/lib/checkout/resolve-checkout-pay-integration-context");
    const { handleStripeWebhookEvent } =
      await import("@/lib/stripe/handle-stripe-webhook-event");
    const { getStripeClient } = await import("@/lib/stripe/stripe-client");

    const context = await resolveCheckoutPayIntegrationContext();
    const payResult = await executeInitiateCheckoutPayment(context.paymentInput);

    expect(payResult.success).toBe(true);
    if (!payResult.success) {
      return;
    }

    const sessionId = extractStripeCheckoutSessionId(payResult.redirectUrl);
    expect(sessionId).toBeTruthy();

    const stripe = getStripeClient();
    expect(stripe).not.toBeNull();

    const paidSession = await buildPaidCheckoutSessionForFulfilmentIntegration(
      stripe!,
      sessionId!,
    );
    expect(paidSession.payment_status).toBe("paid");

    const checkoutId = paidSession.metadata?.checkoutId?.trim();
    expect(checkoutId).toBeTruthy();

    const pendingBeforeWebhook = await getPendingCheckoutById(checkoutId!);
    expect(pendingBeforeWebhook?.status).toBe("pending");
    expect(pendingBeforeWebhook?.bokunConfirmationCode).toBeTruthy();

    const webhookResult = await handleStripeWebhookEvent(
      buildCheckoutSessionCompletedEvent(paidSession),
    );
    expect(webhookResult.success).toBe(true);
    if (!webhookResult.success) {
      throw new Error(`Webhook fulfilment failed: ${webhookResult.error}`);
    }

    const pending = await getPendingCheckoutById(checkoutId!);
    expect(pending?.status).toBe("paid");
    expect(pending?.productConfirmationCode?.trim()).toBeTruthy();

    const success = await assertCheckoutFulfilmentReadyForSuccessPage(sessionId!);
    expect(success.bookingReference).toBe(pending!.productConfirmationCode);

    console.info("[integration:checkout:fulfilment] confirmed booking:", {
      checkoutId,
      sessionId,
      bokunConfirmationCode: pending?.bokunConfirmationCode,
      productConfirmationCode: pending?.productConfirmationCode,
      slot: context.slot,
    });
  }, 180_000);
});

describe("checkout fulfilment — live integration prerequisites", () => {
  it("documents missing env when flag is set but credentials are incomplete", () => {
    if (!isCheckoutPayIntegrationEnabled()) {
      return;
    }

    const missing = getMissingCheckoutPayIntegrationEnvVars();
    expect(missing).toEqual([]);
  });
});
