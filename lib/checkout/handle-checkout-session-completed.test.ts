/**
 * handleCheckoutSessionCompleted — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 *
 * Critical invariants:
 * - Resolves pending checkout via Stripe session id index
 * - CAS `pending → paid` for idempotent payment confirmation
 * - Retries safely when another worker already marked the row paid
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";

const getPendingCheckoutByStripeSessionIdMock = vi.fn();
const updatePendingCheckoutMock = vi.fn();
const getPendingCheckoutByIdMock = vi.fn();
const claimPendingCheckoutPaidFulfilmentMock = vi.fn();
const releasePendingCheckoutPaidFulfilmentMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutByStripeSessionId: (...args: unknown[]) =>
    getPendingCheckoutByStripeSessionIdMock(...args),
  updatePendingCheckout: (...args: unknown[]) =>
    updatePendingCheckoutMock(...args),
  getPendingCheckoutById: (...args: unknown[]) =>
    getPendingCheckoutByIdMock(...args),
  claimPendingCheckoutPaidFulfilment: (...args: unknown[]) =>
    claimPendingCheckoutPaidFulfilmentMock(...args),
  releasePendingCheckoutPaidFulfilment: (...args: unknown[]) =>
    releasePendingCheckoutPaidFulfilmentMock(...args),
}));

import { handleCheckoutSessionCompleted } from "@/lib/checkout/handle-checkout-session-completed";

const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";
const SESSION_ID = "cs_test_123";
const CLAIM_TOKEN = "claim-token-abc";

function buildPendingRecord(
  overrides: Partial<PendingCheckoutRecord> = {},
): PendingCheckoutRecord {
  return {
    id: CHECKOUT_ID,
    status: "pending",
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
    stripeSessionId: SESSION_ID,
    createdAt: "2026-07-06T10:00:00.000Z",
    expiresAt: "2026-07-06T10:30:00.000Z",
    ...overrides,
  };
}

function buildSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: SESSION_ID,
    object: "checkout.session",
    payment_status: "paid",
    metadata: { checkoutId: CHECKOUT_ID },
    ...overrides,
  } as Stripe.Checkout.Session;
}

describe("handleCheckoutSessionCompleted", () => {
  beforeEach(() => {
    getPendingCheckoutByStripeSessionIdMock.mockReset();
    updatePendingCheckoutMock.mockReset();
    getPendingCheckoutByIdMock.mockReset();
    claimPendingCheckoutPaidFulfilmentMock.mockReset();
    releasePendingCheckoutPaidFulfilmentMock.mockReset();
    claimPendingCheckoutPaidFulfilmentMock.mockResolvedValue({
      success: true,
      outcome: "claimed",
      token: CLAIM_TOKEN,
    });
    releasePendingCheckoutPaidFulfilmentMock.mockResolvedValue(undefined);
  });

  it("returns invalid_session when the session id is missing", async () => {
    await expect(
      handleCheckoutSessionCompleted(buildSession({ id: undefined })),
    ).resolves.toEqual({
      success: false,
      error: "invalid_session",
    });
  });

  it("returns invalid_session when payment_status is not paid", async () => {
    await expect(
      handleCheckoutSessionCompleted(
        buildSession({ payment_status: "unpaid" }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "invalid_session",
    });
  });

  it("returns not_found when no pending checkout matches the session", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(null);

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: false,
        error: "not_found",
      },
    );
  });

  it("wins the atomic claim, marks the row paid, and may fulfil", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord(),
    );
    updatePendingCheckoutMock.mockResolvedValue({
      success: true,
      data: buildPendingRecord({ status: "paid" }),
    });

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: true,
        checkoutId: CHECKOUT_ID,
        shouldFulfil: true,
        claimToken: CLAIM_TOKEN,
        alreadyPaid: false,
        productConfirmationCode: undefined,
      },
    );

    expect(claimPendingCheckoutPaidFulfilmentMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
    );
    expect(updatePendingCheckoutMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      { status: "paid" },
      { expectedStatus: "pending" },
    );
  });

  it("exits without fulfilling when a concurrent delivery holds the claim", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord(),
    );
    claimPendingCheckoutPaidFulfilmentMock.mockResolvedValue({
      success: true,
      outcome: "in_progress",
    });

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: true,
        checkoutId: CHECKOUT_ID,
        shouldFulfil: false,
        alreadyPaid: true,
        productConfirmationCode: undefined,
      },
    );

    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("wins the claim on an already-paid row and may re-attempt fulfilment", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord({ status: "paid" }),
    );

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: true,
        checkoutId: CHECKOUT_ID,
        shouldFulfil: true,
        claimToken: CLAIM_TOKEN,
        alreadyPaid: true,
        productConfirmationCode: undefined,
      },
    );

    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when the atomic claim store is unavailable", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord(),
    );
    claimPendingCheckoutPaidFulfilmentMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: false,
        error: "unavailable",
      },
    );

    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
    expect(releasePendingCheckoutPaidFulfilmentMock).not.toHaveBeenCalled();
  });

  it("returns conflict when the row is terminal but not paid", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord({ status: "failed" }),
    );

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: false,
        error: "conflict",
      },
    );

    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("releases the paid-fulfilment claim when KV update fails", async () => {
    getPendingCheckoutByStripeSessionIdMock.mockResolvedValue(
      buildPendingRecord(),
    );
    updatePendingCheckoutMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    await expect(handleCheckoutSessionCompleted(buildSession())).resolves.toEqual(
      {
        success: false,
        error: "unavailable",
      },
    );

    expect(releasePendingCheckoutPaidFulfilmentMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      CLAIM_TOKEN,
    );
  });
});
