/**
 * fulfilPaidCheckout — red/green TDD specs (LOC-1166 / PRD Task 4.3).
 *
 * Critical invariants:
 * - Confirms Bókun reserved booking after KV row is `paid`
 * - Idempotent when `productConfirmationCode` is already stored
 * - Persists Bókun booking id + product confirmation code on success
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";

const getPendingCheckoutByIdMock = vi.fn();
const updatePendingCheckoutMock = vi.fn();
const releasePendingCheckoutPaidFulfilmentMock = vi.fn();
const confirmReservedBokunCheckoutMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutById: (...args: unknown[]) =>
    getPendingCheckoutByIdMock(...args),
  updatePendingCheckout: (...args: unknown[]) =>
    updatePendingCheckoutMock(...args),
  releasePendingCheckoutPaidFulfilment: (...args: unknown[]) =>
    releasePendingCheckoutPaidFulfilmentMock(...args),
}));

vi.mock("@/lib/bokun/checkout", () => ({
  confirmReservedBokunCheckout: (...args: unknown[]) =>
    confirmReservedBokunCheckoutMock(...args),
}));

import {
  FULFILMENT_PERSIST_MAX_ATTEMPTS,
  fulfilPaidCheckout,
} from "@/lib/checkout/fulfil-paid-checkout";

const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";
const CLAIM_TOKEN = "claim-token-abc";

function buildPendingRecord(
  overrides: Partial<PendingCheckoutRecord> = {},
): PendingCheckoutRecord {
  return {
    id: CHECKOUT_ID,
    status: "paid",
    productId: "1079932",
    date: "2026-07-15",
    startTimeId: 4252139,
    participants: { adults: 1, youth: 0, children: 0, infants: 0 },
    quoteSnapshot: {
      totalAmount: 496,
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
    bokunConfirmationCode: "LOC-T123",
    handoffTokenDigest: "b".repeat(64),
    stripeSessionId: "cs_test_123",
    createdAt: "2026-07-06T10:00:00.000Z",
    expiresAt: "2026-07-06T10:30:00.000Z",
    ...overrides,
  };
}

function buildSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    payment_intent: "pi_test_123",
    ...overrides,
  } as Stripe.Checkout.Session;
}

describe("fulfilPaidCheckout", () => {
  beforeEach(() => {
    getPendingCheckoutByIdMock.mockReset();
    updatePendingCheckoutMock.mockReset();
    releasePendingCheckoutPaidFulfilmentMock.mockReset();
    confirmReservedBokunCheckoutMock.mockReset();

    releasePendingCheckoutPaidFulfilmentMock.mockResolvedValue(undefined);
    getPendingCheckoutByIdMock.mockResolvedValue(buildPendingRecord());
    confirmReservedBokunCheckoutMock.mockResolvedValue({
      success: true,
      data: {
        bokunBookingId: "987654",
        productConfirmationCode: "LOC-P456",
      },
    });
    updatePendingCheckoutMock.mockResolvedValue({
      success: true,
      data: buildPendingRecord({
        bokunBookingId: "987654",
        productConfirmationCode: "LOC-P456",
      }),
    });
  });

  it("returns not_found when the checkout row is missing", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(null);

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "not_found",
    });
  });

  it("returns not_paid when the checkout row is still pending", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(
      buildPendingRecord({ status: "pending" }),
    );

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "not_paid",
    });
  });

  it("returns missing_reservation when bokunConfirmationCode is absent", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(
      buildPendingRecord({ bokunConfirmationCode: undefined }),
    );

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "missing_reservation",
    });
  });

  it("is idempotent when productConfirmationCode is already stored", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(
      buildPendingRecord({
        productConfirmationCode: "LOC-P456",
        bokunBookingId: "987654",
      }),
    );

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: true,
      productConfirmationCode: "LOC-P456",
    });

    expect(confirmReservedBokunCheckoutMock).not.toHaveBeenCalled();
    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("confirms Bókun reserved booking and persists fulfilment fields", async () => {
    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: false,
      productConfirmationCode: "LOC-P456",
    });

    expect(confirmReservedBokunCheckoutMock).toHaveBeenCalledWith({
      confirmationCode: "LOC-T123",
      amount: 496,
      currency: "EUR",
      transactionId: "pi_test_123",
      sendNotificationToMainContact: true,
    });
    expect(updatePendingCheckoutMock).toHaveBeenCalledWith(CHECKOUT_ID, {
      bokunBookingId: "987654",
      productConfirmationCode: "LOC-P456",
    });
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });

  it("falls back to checkout session id when payment_intent is missing", async () => {
    await fulfilPaidCheckout(
      CHECKOUT_ID,
      buildSession({ payment_intent: null }),
      CLAIM_TOKEN,
    );

    expect(confirmReservedBokunCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "cs_test_123",
      }),
    );
  });

  it("releases the claim and returns confirm_failed when Bókun confirm fails", async () => {
    confirmReservedBokunCheckoutMock.mockResolvedValue({
      success: false,
      error: "confirm_failed",
    });

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "confirm_failed",
    });

    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
    expect(releasePendingCheckoutPaidFulfilmentMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      CLAIM_TOKEN,
    );
  });

  it("keeps the claim and retries persistence when KV update fails post-confirm", async () => {
    updatePendingCheckoutMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "unavailable",
    });

    // Bókun already confirmed: the claim must NOT be released (a retry would
    // otherwise re-confirm and double-book), and persistence is retried.
    expect(updatePendingCheckoutMock).toHaveBeenCalledTimes(
      FULFILMENT_PERSIST_MAX_ATTEMPTS,
    );
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });

  it("treats a thrown KV error as retryable and keeps the claim post-confirm", async () => {
    updatePendingCheckoutMock.mockRejectedValue(new Error("redis timeout"));

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: false,
      error: "unavailable",
    });

    // The throw must not escape the retry loop; all attempts are exhausted and
    // the claim is retained so a Stripe retry cannot re-confirm at Bókun.
    expect(updatePendingCheckoutMock).toHaveBeenCalledTimes(
      FULFILMENT_PERSIST_MAX_ATTEMPTS,
    );
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });

  it("recovers when a thrown KV error succeeds on a later attempt post-confirm", async () => {
    updatePendingCheckoutMock
      .mockRejectedValueOnce(new Error("redis timeout"))
      .mockResolvedValueOnce({
        success: true,
        data: buildPendingRecord({
          bokunBookingId: "987654",
          productConfirmationCode: "LOC-P456",
        }),
      });

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: false,
      productConfirmationCode: "LOC-P456",
    });

    expect(updatePendingCheckoutMock).toHaveBeenCalledTimes(2);
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });

  it("recovers when a transient KV failure succeeds on retry post-confirm", async () => {
    updatePendingCheckoutMock
      .mockResolvedValueOnce({ success: false, error: "unavailable" })
      .mockResolvedValueOnce({
        success: true,
        data: buildPendingRecord({
          bokunBookingId: "987654",
          productConfirmationCode: "LOC-P456",
        }),
      });

    await expect(
      fulfilPaidCheckout(CHECKOUT_ID, buildSession(), CLAIM_TOKEN),
    ).resolves.toEqual({
      success: true,
      checkoutId: CHECKOUT_ID,
      alreadyFulfilled: false,
      productConfirmationCode: "LOC-P456",
    });

    expect(updatePendingCheckoutMock).toHaveBeenCalledTimes(2);
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });
});
