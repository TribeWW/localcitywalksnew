/**
 * checkout fulfilment integration helpers — red/green TDD specs (LOC-1169).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import {
  assertCheckoutFulfilmentReadyForSuccessPage,
  buildPaidCheckoutSessionForFulfilmentIntegration,
  resolveStripeCheckoutSessionAmountTotal,
} from "@/lib/checkout/checkout-fulfilment-integration";

const confirmStripeTestPaymentIntentMock = vi.fn();
const getPendingCheckoutByStripeSessionIdMock = vi.fn();
const retrievePaidStripeCheckoutSessionMock = vi.fn();
const loadCheckoutSuccessMock = vi.fn();

vi.mock("@/lib/checkout/complete-stripe-test-checkout-session", () => ({
  confirmStripeTestPaymentIntent: (...args: unknown[]) =>
    confirmStripeTestPaymentIntentMock(...args),
  extractStripeCheckoutPaymentIntentId: (paymentIntent: unknown) => {
    if (typeof paymentIntent === "string") {
      return paymentIntent;
    }
    return null;
  },
}));

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutByStripeSessionId: (...args: unknown[]) =>
    getPendingCheckoutByStripeSessionIdMock(...args),
}));

vi.mock("@/lib/stripe/retrieve-paid-checkout-session", () => ({
  retrievePaidStripeCheckoutSession: (...args: unknown[]) =>
    retrievePaidStripeCheckoutSessionMock(...args),
}));

vi.mock("@/lib/checkout/load-checkout-success", () => ({
  loadCheckoutSuccess: (...args: unknown[]) => loadCheckoutSuccessMock(...args),
}));

describe("resolveStripeCheckoutSessionAmountTotal", () => {
  it("prefers session.amount_total when present", async () => {
    const stripe = {
      checkout: {
        sessions: {
          listLineItems: vi.fn(),
        },
      },
    } as unknown as Stripe;

    await expect(
      resolveStripeCheckoutSessionAmountTotal(stripe, {
        id: "cs_test_1",
        amount_total: 24800,
      } as Stripe.Checkout.Session),
    ).resolves.toBe(24800);
  });

  it("falls back to the first line item amount", async () => {
    const stripe = {
      checkout: {
        sessions: {
          listLineItems: vi.fn().mockResolvedValue({
            data: [{ amount_total: 24800 }],
          }),
        },
      },
    } as unknown as Stripe;

    await expect(
      resolveStripeCheckoutSessionAmountTotal(stripe, {
        id: "cs_test_1",
      } as Stripe.Checkout.Session),
    ).resolves.toBe(24800);
  });
});

describe("buildPaidCheckoutSessionForFulfilmentIntegration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates and confirms a test PaymentIntent when the session has none", async () => {
    confirmStripeTestPaymentIntentMock.mockResolvedValue(undefined);

    const retrieve = vi.fn().mockResolvedValue({
      id: "cs_test_open",
      payment_status: "unpaid",
      payment_intent: null,
      currency: "eur",
      amount_total: 24800,
      metadata: { checkoutId: "checkout-uuid" },
    });
    const create = vi.fn().mockResolvedValue({ id: "pi_test_created" });
    const stripe = {
      checkout: {
        sessions: {
          retrieve,
          listLineItems: vi.fn(),
        },
      },
      paymentIntents: {
        create,
      },
    } as unknown as Stripe;

    const paid = await buildPaidCheckoutSessionForFulfilmentIntegration(
      stripe,
      "cs_test_open",
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 24800,
        currency: "eur",
        metadata: { checkoutId: "checkout-uuid" },
      }),
    );
    expect(confirmStripeTestPaymentIntentMock).toHaveBeenCalledWith(
      stripe,
      "pi_test_created",
    );
    expect(paid.payment_status).toBe("paid");
    expect(paid.payment_intent).toBe("pi_test_created");
  });
});

describe("assertCheckoutFulfilmentReadyForSuccessPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns booking reference when KV is fulfilment-ready but Stripe is still unpaid", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue({
      status: "paid",
      productConfirmationCode: "LOC-P123",
    });
    retrievePaidStripeCheckoutSessionMock.mockResolvedValue({
      success: false,
      error: "unpaid",
    });

    await expect(
      assertCheckoutFulfilmentReadyForSuccessPage("cs_test_open"),
    ).resolves.toEqual({
      bookingReference: "LOC-P123",
      stripeVerifiedPaid: false,
    });

    expect(loadCheckoutSuccessMock).not.toHaveBeenCalled();
  });

  it("loads the success page when Stripe verifies the session as paid", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue({
      status: "paid",
      productConfirmationCode: "LOC-P123",
    });
    retrievePaidStripeCheckoutSessionMock.mockResolvedValue({
      success: true,
      session: { id: "cs_test_paid" },
    });
    loadCheckoutSuccessMock.mockResolvedValue({
      status: "ready",
      bookingReference: "LOC-P123",
    });

    await expect(
      assertCheckoutFulfilmentReadyForSuccessPage("cs_test_paid"),
    ).resolves.toEqual({
      bookingReference: "LOC-P123",
      stripeVerifiedPaid: true,
    });
  });
});
