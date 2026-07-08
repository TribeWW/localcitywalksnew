/**
 * processStripeWebhookRequest — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 *
 * Maps signature verification and fulfilment outcomes to HTTP responses
 * expected by Stripe webhook delivery.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

const constructStripeWebhookEventMock = vi.fn();
const handleStripeWebhookEventMock = vi.fn();

vi.mock("@/lib/stripe/construct-stripe-webhook-event", () => ({
  constructStripeWebhookEvent: (...args: unknown[]) =>
    constructStripeWebhookEventMock(...args),
}));

vi.mock("@/lib/stripe/handle-stripe-webhook-event", () => ({
  handleStripeWebhookEvent: (...args: unknown[]) =>
    handleStripeWebhookEventMock(...args),
}));

import { processStripeWebhookRequest } from "@/lib/stripe/process-stripe-webhook-request";

const WEBHOOK_SECRET = "whsec_test_secret";

function buildSignedPayload() {
  const payload = JSON.stringify({
    id: "evt_test_checkout_completed",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
      },
    },
  });

  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

  return { payload, signature };
}

describe("processStripeWebhookRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    constructStripeWebhookEventMock.mockReset();
    handleStripeWebhookEventMock.mockReset();
  });

  it("returns 400 when signature verification fails", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: false,
      error: "invalid_signature",
    });

    await expect(processStripeWebhookRequest("{}", "sig")).resolves.toEqual({
      status: 400,
      body: { error: "invalid_signature" },
    });
  });

  it("returns 400 when the stripe-signature header is missing", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: false,
      error: "missing_signature",
    });

    await expect(processStripeWebhookRequest("{}", undefined)).resolves.toEqual({
      status: 400,
      body: { error: "missing_signature" },
    });
  });

  it("returns 500 when webhook env is not configured", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: false,
      error: "unconfigured",
    });

    await expect(processStripeWebhookRequest("{}", "sig")).resolves.toEqual({
      status: 500,
      body: { error: "unconfigured" },
    });
  });

  it("returns 200 when checkout.session.completed is processed", async () => {
    const event = {
      id: "evt_test_checkout_completed",
      type: "checkout.session.completed",
    };
    constructStripeWebhookEventMock.mockReturnValue({
      success: true,
      event,
    });
    handleStripeWebhookEventMock.mockResolvedValue({
      success: true,
      action: "checkout_paid",
      checkoutId: "550e8400-e29b-41d4-a716-446655440000",
      alreadyPaid: false,
    });

    await expect(processStripeWebhookRequest("payload", "sig")).resolves.toEqual({
      status: 200,
      body: { received: true },
    });

    expect(handleStripeWebhookEventMock).toHaveBeenCalledWith(event);
  });

  it("acknowledges terminal fulfilment failures so Stripe does not retry forever", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: true,
      event: { id: "evt_test", type: "checkout.session.completed" },
    });
    handleStripeWebhookEventMock.mockResolvedValue({
      success: false,
      error: "not_found",
    });

    await expect(processStripeWebhookRequest("payload", "sig")).resolves.toEqual(
      {
        status: 200,
        body: { received: true },
      },
    );
  });

  it("returns 500 for transient fulfilment failures so Stripe retries", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: true,
      event: { id: "evt_unavailable", type: "checkout.session.completed" },
    });
    handleStripeWebhookEventMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(processStripeWebhookRequest("payload", "sig")).resolves.toEqual(
      {
        status: 500,
        body: { error: "unavailable" },
      },
    );
  });

  it("returns 200 for duplicate and ignored events", async () => {
    constructStripeWebhookEventMock.mockReturnValue({
      success: true,
      event: { id: "evt_dup", type: "checkout.session.completed" },
    });
    handleStripeWebhookEventMock.mockResolvedValue({
      success: true,
      action: "duplicate",
    });

    await expect(processStripeWebhookRequest("payload", "sig")).resolves.toEqual({
      status: 200,
      body: { received: true },
    });
  });
});
