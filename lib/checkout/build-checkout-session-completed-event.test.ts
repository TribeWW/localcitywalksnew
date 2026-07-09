/**
 * buildCheckoutSessionCompletedEvent — red/green TDD specs (LOC-1169 / PRD Task 4.6).
 */

import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { buildCheckoutSessionCompletedEvent } from "@/lib/checkout/build-checkout-session-completed-event";

const PAID_SESSION = {
  id: "cs_test_integration",
  object: "checkout.session",
  payment_status: "paid",
  metadata: { checkoutId: "checkout-uuid" },
} as unknown as Stripe.Checkout.Session;

describe("buildCheckoutSessionCompletedEvent", () => {
  it("wraps a paid session in a checkout.session.completed event", () => {
    const event = buildCheckoutSessionCompletedEvent(
      PAID_SESSION,
      "evt_integration_fixed",
    );

    expect(event.id).toBe("evt_integration_fixed");
    expect(event.type).toBe("checkout.session.completed");
    expect(event.data.object).toEqual(PAID_SESSION);
  });

  it("generates a unique event id when none is provided", () => {
    const first = buildCheckoutSessionCompletedEvent(PAID_SESSION);
    const second = buildCheckoutSessionCompletedEvent(PAID_SESSION);

    expect(first.id).toMatch(/^evt_integration_/);
    expect(second.id).toMatch(/^evt_integration_/);
    expect(first.id).not.toBe(second.id);
  });
});
