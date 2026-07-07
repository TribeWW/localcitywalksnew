/**
 * initiateCheckoutPayment pipeline — red/green TDD specs (LOC-1161 / PRD Task 3.3).
 *
 * Critical invariants:
 * - Invalid contact / terms never reach Bókun reserve or Stripe
 * - Handoff token must verify before re-quote
 * - Server re-quote must match clientQuote (anti-tamper)
 * - Happy path: reserve → KV pending → Stripe session → redirect URL
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetQuote } from "@/types/bokun";

const computeTourBookingQuoteMock = vi.fn();
const getTourDetailByIdMock = vi.fn();
const reserveBokunCheckoutMock = vi.fn();
const abortReservedBokunCheckoutMock = vi.fn();
const createPendingCheckoutMock = vi.fn();
const updatePendingCheckoutMock = vi.fn();
const createStripeCheckoutSessionMock = vi.fn();

vi.mock("@/lib/actions/booking-widget.actions", () => ({
  computeTourBookingQuote: (...args: unknown[]) =>
    computeTourBookingQuoteMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

vi.mock("@/lib/bokun/checkout", () => ({
  reserveBokunCheckout: (...args: unknown[]) =>
    reserveBokunCheckoutMock(...args),
  abortReservedBokunCheckout: (...args: unknown[]) =>
    abortReservedBokunCheckoutMock(...args),
}));

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  createPendingCheckout: (...args: unknown[]) =>
    createPendingCheckoutMock(...args),
  updatePendingCheckout: (...args: unknown[]) =>
    updatePendingCheckoutMock(...args),
}));

vi.mock("@/lib/stripe/create-checkout-session", () => ({
  createStripeCheckoutSession: (...args: unknown[]) =>
    createStripeCheckoutSessionMock(...args),
}));

import { BOOKING_WIDGET_PRICE_MISMATCH_ERROR } from "@/lib/actions/booking-widget-submit";
import {
  CHECKOUT_HANDOFF_EXPIRED_ERROR,
  CHECKOUT_HANDOFF_INVALID_ERROR,
  CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
  executeInitiateCheckoutPayment,
  resolveBokunReserveFailureMessage,
  runInitiateCheckoutPayment,
} from "@/lib/checkout/initiate-checkout-payment";
import {
  signCheckoutHandoffToken,
  type SignCheckoutHandoffInput,
} from "@/lib/checkout/handoff-token";

const HANDOFF_SECRET = "test-handoff-secret-with-32-characters-min";
const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";

function futureIsoDate(daysAhead = 7): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const handoffInput: SignCheckoutHandoffInput = {
  productId: "1079932",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  clientQuote: { totalAmount: 448, currency: "EUR" },
  productTitle: "Hello Biarritz",
};

const paymentContact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+34600000000",
};

const paymentClientQuote = { totalAmount: 448, currency: "EUR" };

function buildPaymentInput(token: string) {
  return {
    handoffToken: token,
    contact: paymentContact,
    termsAccepted: true as const,
    clientQuote: paymentClientQuote,
  };
}

describe("runInitiateCheckoutPayment — validation gates", () => {
  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
    reserveBokunCheckoutMock.mockReset();
    abortReservedBokunCheckoutMock.mockReset();
    abortReservedBokunCheckoutMock.mockResolvedValue({ success: true });
    createPendingCheckoutMock.mockReset();
    updatePendingCheckoutMock.mockReset();
    createStripeCheckoutSessionMock.mockReset();
  });

  afterEach(() => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("rejects missing first name before reserve", async () => {
    const token = signCheckoutHandoffToken(handoffInput);

    const result = await runInitiateCheckoutPayment({
      ...buildPaymentInput(token),
      contact: { ...paymentContact, firstName: "" },
    });

    expect(result).toEqual({
      success: false,
      error: "Please enter your first name",
    });
    expect(reserveBokunCheckoutMock).not.toHaveBeenCalled();
  });

  it("rejects unchecked terms before reserve", async () => {
    const token = signCheckoutHandoffToken(handoffInput);

    const result = await runInitiateCheckoutPayment({
      ...buildPaymentInput(token),
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(reserveBokunCheckoutMock).not.toHaveBeenCalled();
  });
});

describe("executeInitiateCheckoutPayment — pipeline invariants", () => {
  let paymentInput: ReturnType<typeof buildPaymentInput>;

  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    const handoffToken = signCheckoutHandoffToken(handoffInput);
    paymentInput = buildPaymentInput(handoffToken);

    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
    reserveBokunCheckoutMock.mockReset();
    abortReservedBokunCheckoutMock.mockReset();
    abortReservedBokunCheckoutMock.mockResolvedValue({ success: true });
    createPendingCheckoutMock.mockReset();
    updatePendingCheckoutMock.mockReset();
    createStripeCheckoutSessionMock.mockReset();

    computeTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "1079932",
        title: "Hello Biarritz",
        defaultRateId: 2199582,
        keyPhoto: { derived: [] },
      },
    });
    reserveBokunCheckoutMock.mockResolvedValue({
      success: true,
      data: {
        confirmationCode: "LOC-T123",
        checkoutAmount: 448,
        currency: "EUR",
        externalBookingReference: CHECKOUT_ID,
      },
    });
    createPendingCheckoutMock.mockResolvedValue({
      success: true,
      data: { id: CHECKOUT_ID },
    });
    updatePendingCheckoutMock.mockResolvedValue({
      success: true,
      data: { id: CHECKOUT_ID, stripeSessionId: "cs_test_123" },
    });
    createStripeCheckoutSessionMock.mockResolvedValue({
      success: true,
      data: {
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.test/cs_test_123",
      },
    });
  });

  afterEach(() => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;
    vi.useRealTimers();
  });

  it("rejects an invalid handoff token before re-quote", async () => {
    const result = await executeInitiateCheckoutPayment({
      ...paymentInput,
      handoffToken: "not-a-valid-token",
    });

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_HANDOFF_INVALID_ERROR,
    });
    expect(computeTourBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("rejects an expired handoff token", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const token = signCheckoutHandoffToken(handoffInput);
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    const result = await executeInitiateCheckoutPayment({
      ...paymentInput,
      handoffToken: token,
    });

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_HANDOFF_EXPIRED_ERROR,
    });
  });

  it("tamper invariant: rejects mismatched clientQuote total", async () => {
    const result = await executeInitiateCheckoutPayment({
      ...paymentInput,
      clientQuote: { totalAmount: 1, currency: "EUR" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
    expect(reserveBokunCheckoutMock).not.toHaveBeenCalled();
  });

  it("maps Bókun reserve_failed to sold-out copy", () => {
    expect(resolveBokunReserveFailureMessage("reserve_failed")).toContain(
      "no longer available",
    );
  });

  it("maps Bókun options_failed to payment unavailable copy", () => {
    expect(resolveBokunReserveFailureMessage("options_failed")).toBe(
      CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
    );
  });

  it("aborts Bókun reservation when KV create fails after reserve", async () => {
    createPendingCheckoutMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    const result = await executeInitiateCheckoutPayment(paymentInput);

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
    });
    expect(abortReservedBokunCheckoutMock).toHaveBeenCalledWith("LOC-T123");
    expect(createStripeCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("aborts Bókun reservation when Stripe session create fails", async () => {
    createStripeCheckoutSessionMock.mockResolvedValue({ success: false });

    const result = await executeInitiateCheckoutPayment(paymentInput);

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
    });
    expect(abortReservedBokunCheckoutMock).toHaveBeenCalledWith("LOC-T123");
    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("aborts Bókun reservation when KV stripe index update fails", async () => {
    updatePendingCheckoutMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    const result = await executeInitiateCheckoutPayment(paymentInput);

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
    });
    expect(abortReservedBokunCheckoutMock).toHaveBeenCalledWith("LOC-T123");
  });

  it("aborts Bókun reservation when post-reserve step throws", async () => {
    createPendingCheckoutMock.mockRejectedValue(new Error("redis timeout"));

    const result = await executeInitiateCheckoutPayment(paymentInput);

    expect(result).toEqual({
      success: false,
      error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR,
    });
    expect(abortReservedBokunCheckoutMock).toHaveBeenCalledWith("LOC-T123");
    expect(createStripeCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("happy path: reserve → KV → Stripe session → redirect URL", async () => {
    const result = await executeInitiateCheckoutPayment(paymentInput);

    expect(result).toEqual({
      success: true,
      redirectUrl: "https://checkout.stripe.test/cs_test_123",
    });

    expect(reserveBokunCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "1079932",
        rateId: 2199582,
        externalBookingReference: expect.any(String),
        contact: expect.objectContaining({
          email: "ada@example.com",
        }),
      }),
    );

    expect(createPendingCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        bokunConfirmationCode: "LOC-T123",
        handoffTokenDigest: expect.any(String),
        contact: expect.objectContaining({
          termsAcceptedAt: expect.any(String),
        }),
      }),
    );

    expect(createStripeCheckoutSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutId: expect.any(String),
        customerEmail: "ada@example.com",
        handoffToken: paymentInput.handoffToken,
      }),
    );

    expect(updatePendingCheckoutMock).toHaveBeenCalledWith(
      expect.any(String),
      { stripeSessionId: "cs_test_123" },
    );
    expect(abortReservedBokunCheckoutMock).not.toHaveBeenCalled();
  });
});
