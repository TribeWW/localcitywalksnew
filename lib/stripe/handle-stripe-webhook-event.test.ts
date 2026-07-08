/**
 * handleStripeWebhookEvent — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 *
 * Critical invariants:
 * - Skips duplicate Stripe event ids (PRD Task 4.6)
 * - Dispatches checkout.session.completed to payment confirmation
 * - Acknowledges unhandled event types without error
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const hasProcessedStripeWebhookEventMock = vi.fn();
const markStripeWebhookEventProcessedMock = vi.fn();
const handleCheckoutSessionCompletedMock = vi.fn();
const fulfilPaidCheckoutMock = vi.fn();

vi.mock("@/lib/stripe/stripe-webhook-idempotency", () => ({
  hasProcessedStripeWebhookEvent: (...args: unknown[]) =>
    hasProcessedStripeWebhookEventMock(...args),
  markStripeWebhookEventProcessed: (...args: unknown[]) =>
    markStripeWebhookEventProcessedMock(...args),
}));

vi.mock("@/lib/checkout/handle-checkout-session-completed", () => ({
  handleCheckoutSessionCompleted: (...args: unknown[]) =>
    handleCheckoutSessionCompletedMock(...args),
}));

vi.mock("@/lib/checkout/fulfil-paid-checkout", () => ({
  fulfilPaidCheckout: (...args: unknown[]) => fulfilPaidCheckoutMock(...args),
}));

import { handleStripeWebhookEvent } from "@/lib/stripe/handle-stripe-webhook-event";

const EVENT_ID = "evt_test_checkout_completed";
const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";

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
    hasProcessedStripeWebhookEventMock.mockReset();
    markStripeWebhookEventProcessedMock.mockReset();
    handleCheckoutSessionCompletedMock.mockReset();
    fulfilPaidCheckoutMock.mockReset();

    hasProcessedStripeWebhookEventMock.mockResolvedValue(false);
    markStripeWebhookEventProcessedMock.mockResolvedValue({ success: true });
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyPaid: false,
    });
    fulfilPaidCheckoutMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: false,
      productConfirmationCode: "LOC-P456",
    });
  });

  it("short-circuits duplicate Stripe event ids", async () => {
    hasProcessedStripeWebhookEventMock.mockResolvedValue(true);

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: true,
      action: "duplicate",
    });

    expect(handleCheckoutSessionCompletedMock).not.toHaveBeenCalled();
    expect(markStripeWebhookEventProcessedMock).not.toHaveBeenCalled();
  });

  it("ignores unhandled event types and marks them processed", async () => {
    await expect(
      handleStripeWebhookEvent(buildEvent({ type: "payment_intent.succeeded" })),
    ).resolves.toEqual({
      success: true,
      action: "ignored",
    });

    expect(handleCheckoutSessionCompletedMock).not.toHaveBeenCalled();
    expect(markStripeWebhookEventProcessedMock).toHaveBeenCalledWith(EVENT_ID);
  });

  it("marks checkout paid, confirms Bókun, and records the event id", async () => {
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
    );
    expect(markStripeWebhookEventProcessedMock).toHaveBeenCalledWith(EVENT_ID);
  });

  it("does not mark processed when payment confirmation fails", async () => {
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: false,
      error: "not_found",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "not_found",
    });

    expect(markStripeWebhookEventProcessedMock).not.toHaveBeenCalled();
    expect(fulfilPaidCheckoutMock).not.toHaveBeenCalled();
  });

  it("does not mark processed when Bókun fulfilment fails", async () => {
    handleCheckoutSessionCompletedMock.mockResolvedValue({
      success: true,
      checkoutId: CHECKOUT_ID,
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

    expect(markStripeWebhookEventProcessedMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when idempotency storage fails after fulfilment", async () => {
    markStripeWebhookEventProcessedMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(handleStripeWebhookEvent(buildEvent())).resolves.toEqual({
      success: false,
      error: "unavailable",
    });
  });
});
