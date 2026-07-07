/**
 * parseCheckoutCancelReturn — red/green TDD specs (LOC-1163 / PRD Task 3.5).
 *
 * Critical invariants:
 * - Stripe cancel return is detected only when `cancelled=1` and checkout id is present
 * - Invalid or missing checkout ids are ignored (summary still loads from handoff)
 * - Cleanup authorization binds checkout id to the active handoff token
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";
import { signCheckoutHandoffToken } from "@/lib/checkout/handoff-token";
import type { SignCheckoutHandoffInput } from "@/lib/checkout/handoff-token";

const getPendingCheckoutByIdMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-store", () => ({
  getPendingCheckoutById: (...args: unknown[]) =>
    getPendingCheckoutByIdMock(...args),
}));

import {
  authorizeCheckoutCancelCleanup,
  parseCheckoutCancelReturn,
} from "@/lib/checkout/parse-checkout-cancel-return";

const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";
const HANDOFF_SECRET = "test-handoff-secret-with-32-characters-min";

const handoffInput: SignCheckoutHandoffInput = {
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 2, youth: 0, children: 1, infants: 0 },
  language: "en",
  clientQuote: { totalAmount: 496, currency: "EUR" },
  productTitle: "Hello Palma de Mallorca",
};

function buildPendingRecord(
  overrides: Partial<PendingCheckoutRecord> = {},
): PendingCheckoutRecord {
  return {
    id: CHECKOUT_ID,
    status: "pending",
    productId: handoffInput.productId,
    date: handoffInput.date,
    startTimeId: handoffInput.startTimeId,
    participants: handoffInput.participants,
    language: handoffInput.language,
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
    createdAt: "2026-07-06T10:00:00.000Z",
    expiresAt: "2026-07-06T10:30:00.000Z",
    ...overrides,
  };
}

describe("parseCheckoutCancelReturn", () => {
  it("detects a Stripe cancel return with checkout id", () => {
    expect(
      parseCheckoutCancelReturn({
        cancelled: "1",
        checkoutId: CHECKOUT_ID,
      }),
    ).toEqual({
      isPaymentCancelled: true,
      checkoutId: CHECKOUT_ID,
    });
  });

  it("ignores cancel flag without a valid checkout id", () => {
    expect(
      parseCheckoutCancelReturn({
        cancelled: "1",
        checkoutId: "not-a-uuid",
      }),
    ).toEqual({
      isPaymentCancelled: false,
    });
  });

  it("ignores checkout id when cancel flag is absent", () => {
    expect(
      parseCheckoutCancelReturn({
        checkoutId: CHECKOUT_ID,
      }),
    ).toEqual({
      isPaymentCancelled: false,
    });
  });
});

describe("authorizeCheckoutCancelCleanup", () => {
  let handoffToken: string;

  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
    getPendingCheckoutByIdMock.mockReset();
    handoffToken = signCheckoutHandoffToken(handoffInput);
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("authorizes cleanup when pending checkout matches the handoff", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(buildPendingRecord());

    await expect(
      authorizeCheckoutCancelCleanup(handoffToken, CHECKOUT_ID),
    ).resolves.toBe(true);
  });

  it("rejects cleanup when pending checkout does not match the handoff slot", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(
      buildPendingRecord({ productId: "9999999" }),
    );

    await expect(
      authorizeCheckoutCancelCleanup(handoffToken, CHECKOUT_ID),
    ).resolves.toBe(false);
  });

  it("rejects cleanup when handoff token is missing or invalid", async () => {
    getPendingCheckoutByIdMock.mockResolvedValue(buildPendingRecord());

    await expect(
      authorizeCheckoutCancelCleanup(undefined, CHECKOUT_ID),
    ).resolves.toBe(false);

    await expect(
      authorizeCheckoutCancelCleanup("not-a-token", CHECKOUT_ID),
    ).resolves.toBe(false);
  });
});
