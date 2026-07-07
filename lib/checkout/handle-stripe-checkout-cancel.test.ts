/**
 * handleStripeCheckoutCancel — red/green TDD specs (LOC-1163 / PRD Task 3.5).
 *
 * Critical invariants:
 * - Aborts Bókun reserve and marks KV row failed when customer cancels Stripe Checkout
 * - Idempotent when the pending row is already terminal
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";

const getPendingCheckoutByIdMock = vi.fn();
const updatePendingCheckoutMock = vi.fn();
const abortReservedBokunCheckoutMock = vi.fn();
const getPendingCheckoutRedisMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-redis", () => ({
  getPendingCheckoutRedis: () => getPendingCheckoutRedisMock(),
}));

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutById: (...args: unknown[]) =>
    getPendingCheckoutByIdMock(...args),
  updatePendingCheckout: (...args: unknown[]) =>
    updatePendingCheckoutMock(...args),
}));

vi.mock("@/lib/bokun/checkout", () => ({
  abortReservedBokunCheckout: (...args: unknown[]) =>
    abortReservedBokunCheckoutMock(...args),
}));

import { handleStripeCheckoutCancel } from "@/lib/checkout/handle-stripe-checkout-cancel";

const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";

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
    createdAt: "2026-07-06T10:00:00.000Z",
    expiresAt: "2026-07-06T10:30:00.000Z",
    ...overrides,
  };
}

describe("handleStripeCheckoutCancel", () => {
  beforeEach(() => {
    getPendingCheckoutByIdMock.mockReset();
    updatePendingCheckoutMock.mockReset();
    abortReservedBokunCheckoutMock.mockReset();
    getPendingCheckoutRedisMock.mockReset();
    getPendingCheckoutRedisMock.mockReturnValue({});
    abortReservedBokunCheckoutMock.mockResolvedValue({ success: true });
    updatePendingCheckoutMock.mockResolvedValue({
      success: true,
      data: buildPendingRecord({ status: "failed" }),
    });
  });

  it("aborts Bókun reserve and marks pending checkout failed", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(buildPendingRecord());

    await expect(handleStripeCheckoutCancel(CHECKOUT_ID)).resolves.toEqual({
      success: true,
      releasedReservation: true,
    });

    expect(updatePendingCheckoutMock).toHaveBeenCalledWith(
      CHECKOUT_ID,
      { status: "failed" },
      { expectedStatus: "pending" },
    );
    expect(abortReservedBokunCheckoutMock).toHaveBeenCalledWith("LOC-T123");
  });

  it("is idempotent when pending checkout is already failed", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(
      buildPendingRecord({ status: "failed" }),
    );

    await expect(handleStripeCheckoutCancel(CHECKOUT_ID)).resolves.toEqual({
      success: true,
      releasedReservation: false,
    });

    expect(abortReservedBokunCheckoutMock).not.toHaveBeenCalled();
    expect(updatePendingCheckoutMock).not.toHaveBeenCalled();
  });

  it("returns not_found when checkout id is unknown", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(null);

    await expect(handleStripeCheckoutCancel(CHECKOUT_ID)).resolves.toEqual({
      success: false,
      error: "not_found",
    });
  });

  it("does not abort Bókun when checkout already moved out of pending", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(buildPendingRecord());
    updatePendingCheckoutMock.mockResolvedValue({
      success: false,
      error: "conflict",
    });

    await expect(handleStripeCheckoutCancel(CHECKOUT_ID)).resolves.toEqual({
      success: true,
      releasedReservation: false,
    });

    expect(abortReservedBokunCheckoutMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when pending checkout store is not configured", async () => {
    getPendingCheckoutRedisMock.mockReturnValue(null);

    await expect(handleStripeCheckoutCancel(CHECKOUT_ID)).resolves.toEqual({
      success: false,
      error: "unavailable",
    });

    expect(getPendingCheckoutByIdMock).not.toHaveBeenCalled();
  });
});
