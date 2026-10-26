/**
 * handleStripeWebhookEvent — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 *
 * Critical invariants:
 * - Skips duplicate Stripe event ids (PRD Task 4.6)
 * - Dispatches checkout.session.completed to payment confirmation
 * - Acknowledges unhandled event types without error
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const claimStripeWebhookEventMock = vi.fn();
const releaseStripeWebhookEventClaimMock = vi.fn();
const handleCheckoutSessionCompletedMock = vi.fn();
const fulfilPaidCheckoutMock = vi.fn();
const recordPaidFulfilmentFailureMock = vi.fn();
const getPostHogClientMock = vi.fn();
const flushPostHogLogsMock = vi.fn();

vi.mock("@/lib/stripe/stripe-webhook-idempotency", () => ({
  claimStripeWebhookEvent: (...args: unknown[]) =>
    claimStripeWebhookEventMock(...args),
  releaseStripeWebhookEventClaim: (...args: unknown[]) =>
    releaseStripeWebhookEventClaimMock(...args),
}));

vi.mock("@/lib/checkout/handle-checkout-session-completed", () => ({
  handleCheckoutSessionCompleted: (...args: unknown[]) =>
    handleCheckoutSessionCompletedMock(...args),
}));

vi.mock("@/lib/checkout/fulfil-paid-checkout", () => ({
  fulfilPaidCheckout: (...args: unknown[]) => fulfilPaidCheckoutMock(...args),
}));

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  recordPaidFulfilmentFailure: (...args: unknown[]) =>
    recordPaidFulfilmentFailureMock(...args),
}));

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => getPostHogClientMock(),
}));

vi.mock("@/instrumentation", () => ({
  flushPostHogLogs: () => flushPostHogLogsMock(),
  posthogIntegrationLogger: { emit: vi.fn() },
}));

import { handleStripeWebhookEvent } from "@/lib/stripe/handle-stripe-webhook-event";

const EVENT_ID = "evt_test_checkout_completed";
const CHECKOUT_ID = "WKSAB12CD34E";
const CLAIM_TOKEN = "claim-token-abc";

function buildEvent(
  overrides: Partial<Stripe.Event> = {},
): Stripe.Event {
  return {
    id: EVENT_ID,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        payment_status: "paid",
        metadata: { checkoutId: CHECKOUT_ID },
      },
    },
    ...overrides,
  } as Stripe.Event;
}

describe("handleStripeWebhookEvent", () => {
  beforeEach(() => {
    claimStripeWebhookEventMock.mockReset();
    releaseStripeWebhookEventClaimMock.mockReset();
    handleCheckoutSessionCompletedMock.mockReset();
    fulfilPaidCheckoutMock.mockReset();
    recordPaidFulfilmentFailureMock.mockReset();

    claimStripeWebhookEventMock.mockResolvedValue({
      success: true,
      outcome: "claimed",
    });
    releaseStripeWebhookEventClaimMock.mockResolvedValue(undefined);
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      shouldFulfil: true,
      claimToken: CLAIM_TOKEN,
      alreadyPaid: false,
    });
    fulfilPaidCheckoutMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: false,
      productConfirmationCode: "LOC-P456",
    });
    recordPaidFulfilmentFailureMock.mockResolvedValue({
      success: true,
      attemptCount: 1,
      exhausted: false,
    });
    getPostHogClientMock.mockReset();
    getPostHogClientMock.mockReturnValue(null);
    flushPostHogLogsMock.mockReset();
    flushPostHogLogsMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("short-circuits duplicate Stripe event ids", async () => {
    claimStripeWebhookEventMock.mockResolvedValue({
      success: true,
      outcome: "duplicate",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: true,
      action: "duplicate",
    });

    expect(handleCheckoutSessionCompletedMock).not.toHaveBeenCalled();
    expect(fulfilPaidCheckoutMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when the event id cannot be claimed", async () => {
    claimStripeWebhookEventMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "unavailable",
    });

    expect(handleCheckoutSessionCompletedMock).not.toHaveBeenCalled();
  });

  it("claims the event id before any fulfilment work", async () => {
    await handleStripeWebhookEvent(buildEvent());

    expect(claimStripeWebhookEventMock).toHaveBeenCalledWith(EVENT_ID);
  });

  it("ignores unhandled event types after claiming them", async () => {
    await expect(
      handleStripeWebhookEvent(buildEvent({ type: "payment_intent.succeeded" })),
    ).resolves.toEqual({
      success: true,
      action: "ignored",
    });

    expect(handleCheckoutSessionCompletedMock).not.toHaveBeenCalled();
    expect(claimStripeWebhookEventMock).toHaveBeenCalledWith(EVENT_ID);
    expect(releaseStripeWebhookEventClaimMock).not.toHaveBeenCalled();
  });

  it("marks checkout paid and confirms Bókun without releasing the claim", async () => {
    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: true,
      action: "checkout_paid",
      checkoutId: CHECKOUT_ID,
      alreadyPaid: false,
      productConfirmationCode: "LOC-P456",
    });

    expect(handleCheckoutSessionCompletedMock).toHaveBeenCalledWith(
      buildEvent().data.object,
    );
    expect(fulfilPaidCheckoutMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      buildEvent().data.object,
      CLAIM_TOKEN,
    );
    expect(releaseStripeWebhookEventClaimMock).not.toHaveBeenCalled();
  });

  it("releases the claim when payment confirmation fails", async () => {
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: false,
      error: "not_found",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "not_found",
    });

    expect(releaseStripeWebhookEventClaimMock).toHaveBeenCalledWith(EVENT_ID);
    expect(fulfilPaidCheckoutMock).not.toHaveBeenCalled();
  });

  it("releases the claim when Bókun fulfilment fails so Stripe can retry", async () => {
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      shouldFulfil: true,
      claimToken: CLAIM_TOKEN,
      alreadyPaid: false,
    });
    fulfilPaidCheckoutMock.mockResolvedValue({
      success: false,
      error: "confirm_failed",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "confirm_failed",
    });

    expect(releaseStripeWebhookEventClaimMock).toHaveBeenCalledWith(EVENT_ID);
  });

  it("escalates paid-but-unfulfilled after retries and acknowledges without releasing the event claim", async () => {
    fulfilPaidCheckoutMock.mockResolvedValue({
      success: false,
      error: "confirm_failed",
    });
    recordPaidFulfilmentFailureMock.mockResolvedValue({
      success: true,
      attemptCount: 5,
      exhausted: true,
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "paid_unfulfilled",
    });

    expect(recordPaidFulfilmentFailureMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      "confirm_failed",
    );
    expect(releaseStripeWebhookEventClaimMock).not.toHaveBeenCalled();
  });

  it("acknowledges the loser without fulfilling when it did not win the claim", async () => {
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      shouldFulfil: false,
      alreadyPaid: true,
      productConfirmationCode: "LOC-P456",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: true,
      action: "checkout_paid",
      checkoutId: CHECKOUT_ID,
      alreadyPaid: true,
      productConfirmationCode: "LOC-P456",
    });

    expect(fulfilPaidCheckoutMock).not.toHaveBeenCalled();
    expect(releaseStripeWebhookEventClaimMock).not.toHaveBeenCalled();
  });

  it("returns checkout_paid when both telemetry flushes fail", async () => {
    getPostHogClientMock.mockReturnValue({
      capture: vi.fn(),
      flush: vi.fn().mockRejectedValue(new Error("posthog down")),
    });
    flushPostHogLogsMock.mockRejectedValue(new Error("logs down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: true,
      action: "checkout_paid",
      checkoutId: CHECKOUT_ID,
      alreadyPaid: false,
      productConfirmationCode: "LOC-P456",
    });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("returns checkout_paid when both telemetry flushes stall", async () => {
    vi.useFakeTimers();
    getPostHogClientMock.mockReturnValue({
      capture: vi.fn(),
      flush: () => new Promise(() => {}),
    });
    flushPostHogLogsMock.mockImplementation(() => new Promise(() => {}));

    const pending = handleStripeWebhookEvent(buildEvent());
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual({
      success: true,
      action: "checkout_paid",
      checkoutId: CHECKOUT_ID,
      alreadyPaid: false,
      productConfirmationCode: "LOC-P456",
    });
  });
});
