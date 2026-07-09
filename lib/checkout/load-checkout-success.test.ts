/**
 * loadCheckoutSuccess — red/green TDD specs (LOC-1167 / PRD Task 4.3).
 *
 * Critical invariants:
 * - Requires a paid Stripe Checkout Session (never trust client-only flags)
 * - Resolves KV by stripe session id for booking reference + recap
 * - Shows confirming state when payment succeeded but Bókun ref not persisted yet
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";
import type { BokunProductDetail } from "@/types/bokun";

const retrievePaidStripeCheckoutSessionMock = vi.fn();
const getPendingCheckoutByStripeSessionIdMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/lib/stripe/retrieve-paid-checkout-session", () => ({
  retrievePaidStripeCheckoutSession: (...args: unknown[]) =>
    retrievePaidStripeCheckoutSessionMock(...args),
}));

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutByStripeSessionId: (...args: unknown[]) =>
    getPendingCheckoutByStripeSessionIdMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import { loadCheckoutSuccess } from "@/lib/checkout/load-checkout-success";

const SESSION_ID = "cs_test_abc123";

const pendingRecord: PendingCheckoutRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "paid",
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  quoteSnapshot: {
    totalAmount: 448,
    currency: "EUR",
    source: "bokun-availability",
    breakdown: [],
  },
  contact: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    termsAcceptedAt: "2026-07-06T10:00:00.000Z",
  },
  stripeSessionId: SESSION_ID,
  productConfirmationCode: "LOC-P456",
  createdAt: "2026-07-06T10:00:00.000Z",
  expiresAt: "2026-07-06T10:30:00.000Z",
};

const tourDetail: BokunProductDetail = {
  id: "1079932",
  title: "Hello Biarritz",
  keyPhoto: {
    derived: [{ name: "large", url: "https://cdn.bokun.tools/photo.jpg" }],
  },
  googlePlace: {
    country: "France",
    countryCode: "FR",
    city: "Biarritz",
    cityCode: "biarritz",
  },
  startTimes: [{ id: 4252139, hour: 11, minute: 0 }],
};

describe("loadCheckoutSuccess", () => {
  beforeEach(() => {
    retrievePaidStripeCheckoutSessionMock.mockReset();
    getPendingCheckoutByStripeSessionIdMock.mockReset();
    getTourDetailByIdMock.mockReset();

    retrievePaidStripeCheckoutSessionMock.mockResolvedValue({
      success: true,
      session: {
        id: SESSION_ID,
        payment_status: "paid",
        metadata: { checkoutId: pendingRecord.id },
      },
    });
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(pendingRecord);
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });
  });

  it("returns invalid_session when session_id is missing", async () => {
    const result = await loadCheckoutSuccess(undefined);

    expect(result).toEqual({
      status: "invalid_session",
      message:
        "This payment session isn't valid. Please contact support if you were charged.",
    });
    expect(retrievePaidStripeCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when Stripe is not configured", async () => {
    retrievePaidStripeCheckoutSessionMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result).toEqual({
      status: "unavailable",
      message:
        "We couldn't verify your payment right now. Please try again in a moment.",
    });
  });

  it("returns invalid_session when Stripe session is not paid", async () => {
    retrievePaidStripeCheckoutSessionMock.mockResolvedValue({
      success: false,
      error: "unpaid",
    });

    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result).toEqual({
      status: "invalid_session",
      message:
        "This payment session isn't valid. Please contact support if you were charged.",
    });
  });

  it("returns not_found when no KV row matches the Stripe session", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(null);

    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result.status).toBe("not_found");
    if (result.status !== "not_found") return;

    expect(result.message).toContain("couldn't find your booking");
    expect(result.tourPageHref).toBe("/explore");
  });

  it("returns confirming when payment succeeded but Bókun reference is not stored yet", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue({
      ...pendingRecord,
      status: "pending",
      productConfirmationCode: undefined,
    });

    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result.status).toBe("confirming");
    if (result.status !== "confirming") return;

    expect(result.order.title).toBe("Hello Biarritz");
    expect(result.order.totalAmount).toBe(448);
  });

  it("returns needs_support when fulfilment failed after retries", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue({
      ...pendingRecord,
      status: "failed",
      productConfirmationCode: undefined,
      fulfilmentAttemptCount: 5,
      fulfilmentLastError: "confirm_failed",
      fulfilmentLastErrorAt: "2026-07-06T12:34:56.000Z",
    });

    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result.status).toBe("needs_support");
    if (result.status !== "needs_support") return;

    expect(result.message).toContain("payment was received");
    expect(result.message).toContain("ada@example.com");
    expect(result.message).toContain(SESSION_ID);
  });

  it("returns ready with booking reference when fulfilment completed", async () => {
    const result = await loadCheckoutSuccess(SESSION_ID);

    expect(result).toEqual({
      status: "ready",
      bookingReference: "LOC-P456",
      order: {
        imageUrl: "https://cdn.bokun.tools/photo.jpg?w=960&h=960",
        imageAlt: "Hello Biarritz",
        title: "Hello Biarritz",
        dateLabel: "Wed, 15 Jul 2026",
        timeLabel: "11:00",
        participantsLabel: "1 adult",
        totalAmount: 448,
        currency: "EUR",
      },
    });
  });
});
