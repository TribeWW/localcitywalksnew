/**
 * Phase 2 handoff invariants — red/green TDD specs (LOC-1158 / PRD Task 2.7).
 *
 * Critical invariants:
 * - Token round-trip: `runStartCheckoutHandoff` mints a verifiable `/checkout?h=…` URL
 * - Expiry rejection: tokens fail verification after the 30-minute TTL
 * - Anti-tamper: handoff rejects `clientQuote` that does not match server re-quote
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

import { BOOKING_WIDGET_PRICE_MISMATCH_ERROR } from "@/lib/actions/booking-widget-submit";
import {
  CHECKOUT_HANDOFF_TTL_SECONDS,
  verifyCheckoutHandoffToken,
} from "@/lib/checkout/handoff-token";
import { runStartCheckoutHandoff } from "@/lib/checkout/start-checkout-handoff";

const HANDOFF_SECRET = "test-handoff-secret-with-32-characters-min";

function futureIsoDate(daysAhead = 7): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

const serverQuote: BookingWidgetQuote = {
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

describe("LOC-1158 — handoff slice 2 unit invariants", () => {
  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
    computeTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: serverQuote,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: { id: "1079932", title: "Hello Biarritz", keyPhoto: { derived: [] } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("token round-trip: minted redirect URL verifies with slot + clientQuote payload", async () => {
    const result = await runStartCheckoutHandoff(validHandoffInput);

    expect(result.success).toBe(true);
    if (!result.success) return;

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
    });
  });

  it("expiry rejection: token from happy path fails verify after TTL", async () => {
    const result = await runStartCheckoutHandoff(validHandoffInput);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const token = new URL(result.redirectUrl, "http://localhost").searchParams.get(
      "h",
    )!;

    vi.setSystemTime(
      new Date(Date.now() + CHECKOUT_HANDOFF_TTL_SECONDS * 1000 + 1),
    );

    const verified = verifyCheckoutHandoffToken(token);
    expect(verified.success).toBe(false);
    if (verified.success) return;

    expect(verified.error).toBe("expired");
    expect(verified.recoveryPayload?.productId).toBe(validHandoffInput.productId);
  });

  it("anti-tamper: rejects clientQuote total that does not match server re-quote", async () => {
    const result = await runStartCheckoutHandoff({
      ...validHandoffInput,
      clientQuote: { totalAmount: 1, currency: "EUR" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
    expect(computeTourBookingQuoteMock).toHaveBeenCalled();
  });
});
