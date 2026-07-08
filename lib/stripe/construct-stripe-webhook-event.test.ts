/**
 * constructStripeWebhookEvent — red/green TDD specs (LOC-1176 / PRD Task 4.1).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

import { constructStripeWebhookEvent } from "@/lib/stripe/construct-stripe-webhook-event";

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

describe("constructStripeWebhookEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns unconfigured when STRIPE_WEBHOOK_SECRET is missing", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    expect(constructStripeWebhookEvent("{}", "sig")).toEqual({
      success: false,
      error: "unconfigured",
    });
  });

  it("returns missing_signature when the header is absent", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);

    expect(constructStripeWebhookEvent("{}", undefined)).toEqual({
      success: false,
      error: "missing_signature",
    });
  });

  it("returns invalid_signature for tampered payloads", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
    const { signature } = buildSignedPayload();

    const result = constructStripeWebhookEvent('{"tampered":true}', signature);

    expect(result).toEqual({
      success: false,
      error: "invalid_signature",
    });
  });

  it("returns a verified event for a valid signature", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
    const { payload, signature } = buildSignedPayload();

    const result = constructStripeWebhookEvent(payload, signature);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.event.id).toBe("evt_test_checkout_completed");
    expect(result.event.type).toBe("checkout.session.completed");
  });
});
