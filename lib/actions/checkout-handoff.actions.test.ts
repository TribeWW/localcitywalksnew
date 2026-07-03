/**
 * startCheckoutHandoff pipeline — red/green TDD specs (LOC-1153 / LOC-1158).
 *
 * Critical invariants:
 * - Invalid quote / clientQuote input never reaches Bókun or token minting
 * - Server re-quote must succeed before handoff
 * - Tampered clientQuote is rejected (same anti-tamper as widget submit)
 * - Happy path returns a verifiable `/checkout?h=…` redirect URL
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetQuote } from "@/types/bokun";

const computeTourBookingQuoteMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/lib/actions/booking-widget.actions", () => ({
  computeTourBookingQuote: (...args: unknown[]) =>
    computeTourBookingQuoteMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import {
  executeStartCheckoutHandoff,
  runStartCheckoutHandoff,
} from "@/lib/checkout/start-checkout-handoff";
import { BOOKING_WIDGET_PRICE_MISMATCH_ERROR } from "@/lib/actions/booking-widget-submit";
import { verifyCheckoutHandoffToken } from "@/lib/checkout/handoff-token";

const HANDOFF_SECRET = "test-handoff-secret-with-32-characters-min";

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

const validHandoffInput = {
  productId: "1079932",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  clientQuote: { totalAmount: 448, currency: "EUR" },
  productTitle: "Hello Biarritz",
};

describe("runStartCheckoutHandoff — validation gates", () => {
  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
  });

  afterEach(() => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("rejects invalid product id before quote", async () => {
    const result = await runStartCheckoutHandoff({
      ...validHandoffInput,
      productId: "bad/id",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid product id",
    });
    expect(computeTourBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("rejects invalid clientQuote currency before quote", async () => {
    const result = await runStartCheckoutHandoff({
      ...validHandoffInput,
      clientQuote: { totalAmount: 448, currency: "euro" },
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid currency",
    });
    expect(computeTourBookingQuoteMock).not.toHaveBeenCalled();
  });
});

describe("executeStartCheckoutHandoff — quote and anti-tamper", () => {
  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
    computeTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "1079932",
        title: "Hello Biarritz",
        keyPhoto: { derived: [] },
      },
    });
  });

  afterEach(() => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("returns quote error when server re-quote fails", async () => {
    computeTourBookingQuoteMock.mockResolvedValue({
      success: false,
      error: "Unable to calculate quote for this selection",
    });

    const result = await executeStartCheckoutHandoff(validHandoffInput);

    expect(result).toEqual({
      success: false,
      error: "Unable to calculate quote for this selection",
    });
  });

  it("tamper invariant: rejects mismatched clientQuote total", async () => {
    const result = await executeStartCheckoutHandoff({
      ...validHandoffInput,
      clientQuote: { totalAmount: 1, currency: "EUR" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
  });

  it("tamper invariant: rejects mismatched clientQuote currency", async () => {
    const result = await executeStartCheckoutHandoff({
      ...validHandoffInput,
      clientQuote: { totalAmount: 448, currency: "USD" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
  });

  it("happy path invariant: returns verifiable checkout redirect URL", async () => {
    const result = await executeStartCheckoutHandoff(validHandoffInput);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.redirectUrl).toMatch(/^\/checkout\?h=/);

    const token = new URL(result.redirectUrl, "http://localhost").searchParams.get(
      "h",
    );
    expect(token).toBeTruthy();

    const verified = verifyCheckoutHandoffToken(token!);
    expect(verified.success).toBe(true);
    if (!verified.success) return;

    expect(verified.payload).toMatchObject({
      productId: validHandoffInput.productId,
      date: validHandoffInput.date,
      startTimeId: validHandoffInput.startTimeId,
      participants: validHandoffInput.participants,
      clientQuote: validHandoffInput.clientQuote,
      productTitle: "Hello Biarritz",
    });
  });

  it("uses tour detail title when productTitle is omitted", async () => {
    const inputWithoutTitle = {
      productId: validHandoffInput.productId,
      date: validHandoffInput.date,
      startTimeId: validHandoffInput.startTimeId,
      participants: validHandoffInput.participants,
      clientQuote: validHandoffInput.clientQuote,
    };

    const result = await executeStartCheckoutHandoff(inputWithoutTitle);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const token = new URL(result.redirectUrl, "http://localhost").searchParams.get(
      "h",
    );
    const verified = verifyCheckoutHandoffToken(token!);
    expect(verified.success).toBe(true);
    if (!verified.success) return;

    expect(verified.payload.productTitle).toBe("Hello Biarritz");
  });

  it("config invariant: returns safe error when handoff secret is missing", async () => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;

    const result = await executeStartCheckoutHandoff(validHandoffInput);

    expect(result).toEqual({
      success: false,
      error: "Checkout is not available right now. Please try again later.",
    });
  });
});
