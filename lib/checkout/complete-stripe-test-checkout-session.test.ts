/**
 * completeStripeTestCheckoutSession — red/green TDD specs (LOC-1169 / PRD Task 4.6).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import {
  completeStripeTestCheckoutSession,
  confirmStripeTestPaymentIntent,
  extractStripeCheckoutPaymentIntentId,
} from "@/lib/checkout/complete-stripe-test-checkout-session";

describe("extractStripeCheckoutPaymentIntentId", () => {
  it("reads a string payment_intent id", () => {
    expect(extractStripeCheckoutPaymentIntentId("pi_test_123")).toBe("pi_test_123");
  });

  it("reads an expanded payment_intent object", () => {
    expect(
      extractStripeCheckoutPaymentIntentId({
        id: "pi_test_456",
      } as Stripe.PaymentIntent),
    ).toBe("pi_test_456");
  });

  it("returns null when payment_intent is missing", () => {
    expect(extractStripeCheckoutPaymentIntentId(null)).toBeNull();
  });
});

describe("confirmStripeTestPaymentIntent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips confirm when the PaymentIntent already succeeded", async () => {
    const confirm = vi.fn();
    const stripe = {
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: "succeeded" }),
        confirm,
      },
    } as unknown as Stripe;

    await confirmStripeTestPaymentIntent(stripe, "pi_test_123");

    expect(confirm).not.toHaveBeenCalled();
  });

  it("confirms with pm_card_visa in test mode", async () => {
    const confirm = vi.fn().mockResolvedValue({ status: "succeeded" });
    const stripe = {
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: "requires_payment_method" }),
        confirm,
      },
    } as unknown as Stripe;

    await confirmStripeTestPaymentIntent(stripe, "pi_test_123");

    expect(confirm).toHaveBeenCalledWith("pi_test_123", {
      payment_method: "pm_card_visa",
      return_url: "https://example.com/checkout/success",
    });
  });
});

describe("completeStripeTestCheckoutSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately when the session is already paid", async () => {
    const paidSession = {
      id: "cs_test_paid",
      payment_status: "paid",
    } as Stripe.Checkout.Session;

    const retrieve = vi.fn().mockResolvedValue(paidSession);
    const stripe = {
      checkout: { sessions: { retrieve } },
    } as unknown as Stripe;

    await expect(
      completeStripeTestCheckoutSession(stripe, "cs_test_paid"),
    ).resolves.toEqual(paidSession);

    expect(retrieve).toHaveBeenCalledTimes(1);
  });

  it("confirms the payment intent and polls until the session is paid", async () => {
    const retrieve = vi
      .fn()
      .mockResolvedValueOnce({
        id: "cs_test_open",
        payment_status: "unpaid",
        payment_intent: "pi_test_123",
      })
      .mockResolvedValueOnce({
        id: "cs_test_open",
        payment_status: "unpaid",
      })
      .mockResolvedValueOnce({
        id: "cs_test_open",
        payment_status: "paid",
      });

    const confirm = vi.fn().mockResolvedValue({ status: "succeeded" });
    const stripe = {
      checkout: { sessions: { retrieve } },
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: "requires_payment_method" }),
        confirm,
      },
    } as unknown as Stripe;

    const result = await completeStripeTestCheckoutSession(stripe, "cs_test_open");

    expect(result.payment_status).toBe("paid");
    expect(confirm).toHaveBeenCalledWith(
      "pi_test_123",
      expect.objectContaining({
        payment_method: "pm_card_visa",
      }),
    );
    expect(retrieve).toHaveBeenCalledTimes(3);
  });
});
