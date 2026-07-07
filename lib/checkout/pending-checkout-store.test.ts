/**
 * pendingCheckoutStore — red/green TDD specs (LOC-1159).
 *
 * Critical invariants:
 * - create stores a pending record keyed by internal checkout id with TTL
 * - getById / getByStripeSessionId round-trip stored JSON
 * - update merges patches and maintains stripe-session index
 * - Missing Redis config returns unavailable (no silent in-memory fallback)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetQuote } from "@/types/bokun";

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const getRedisMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-redis", () => ({
  getPendingCheckoutRedis: () => getRedisMock(),
  resetPendingCheckoutRedisClientForTests: vi.fn(),
}));

import {
  createPendingCheckout,
  getPendingCheckoutById,
  getPendingCheckoutByStripeSessionId,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";

const quote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const createInput = {
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  language: "en",
  quoteSnapshot: quote,
  contact: {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "+32470123456",
    termsAcceptedAt: "2026-07-01T12:00:00.000Z",
  },
  bokunConfirmationCode: "LOC-T123",
  handoffTokenDigest: "a".repeat(64),
};

const checkoutId = "550e8400-e29b-41d4-a716-446655440000";

function mockRedisClient() {
  getRedisMock.mockReturnValue({
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    del: (...args: unknown[]) => mockDel(...args),
  });
}

describe("createPendingCheckout", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
    mockSet.mockResolvedValue("OK");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores a pending record with TTL and returns the generated id", async () => {
    const result = await createPendingCheckout(createInput);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.data.status).toBe("pending");
    expect(result.data).toMatchObject({
      productId: "1079932",
      bokunConfirmationCode: "LOC-T123",
      quoteSnapshot: quote,
    });
    expect(result.data.expiresAt).toBe("2026-07-01T12:30:00.000Z");

    expect(mockSet).toHaveBeenCalledWith(
      `checkout:pending:${result.data.id}`,
      expect.objectContaining({ id: result.data.id, status: "pending" }),
      { ex: 1800 },
    );
  });
});

describe("getPendingCheckoutById", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
  });

  it("returns null when the record is missing", async () => {
    mockGet.mockResolvedValue(null);

    await expect(getPendingCheckoutById("missing-id")).resolves.toBeNull();
    expect(mockGet).toHaveBeenCalledWith("checkout:pending:missing-id");
  });

  it("returns the parsed pending checkout record", async () => {
    const record = {
      id: checkoutId,
      status: "pending" as const,
      productId: "1079932",
      date: "2026-07-15",
      startTimeId: 4252139,
      participants: createInput.participants,
      quoteSnapshot: quote,
      contact: createInput.contact,
      handoffTokenDigest: createInput.handoffTokenDigest,
      createdAt: "2026-07-01T12:00:00.000Z",
      expiresAt: "2026-07-01T12:30:00.000Z",
    };
    mockGet.mockResolvedValue(record);

    await expect(getPendingCheckoutById(checkoutId)).resolves.toEqual(record);
  });
});

describe("getPendingCheckoutByStripeSessionId", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
  });

  it("resolves checkout id from stripe index then loads the record", async () => {
    const record = {
      id: checkoutId,
      status: "pending" as const,
      productId: "1079932",
      date: "2026-07-15",
      startTimeId: 4252139,
      participants: createInput.participants,
      quoteSnapshot: quote,
      contact: createInput.contact,
      handoffTokenDigest: createInput.handoffTokenDigest,
      stripeSessionId: "cs_test_123",
      createdAt: "2026-07-01T12:00:00.000Z",
      expiresAt: "2026-07-01T12:30:00.000Z",
    };

    mockGet.mockImplementation(async (key: string) => {
      if (key === "checkout:stripe:cs_test_123") return checkoutId;
      if (key === `checkout:pending:${checkoutId}`) return record;
      return null;
    });

    await expect(
      getPendingCheckoutByStripeSessionId("cs_test_123"),
    ).resolves.toEqual(record);
  });
});

describe("updatePendingCheckout", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
    mockSet.mockResolvedValue("OK");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges updates, writes stripe index, and refreshes TTL", async () => {
    const existing = {
      id: checkoutId,
      status: "pending" as const,
      productId: "1079932",
      date: "2026-07-15",
      startTimeId: 4252139,
      participants: createInput.participants,
      quoteSnapshot: quote,
      contact: createInput.contact,
      handoffTokenDigest: createInput.handoffTokenDigest,
      createdAt: "2026-07-01T12:00:00.000Z",
      expiresAt: "2026-07-01T12:30:00.000Z",
    };
    mockGet.mockResolvedValue(existing);

    const result = await updatePendingCheckout(checkoutId, {
      stripeSessionId: "cs_test_456",
      status: "pending",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.stripeSessionId).toBe("cs_test_456");
    expect(mockSet).toHaveBeenCalledWith(
      `checkout:pending:${checkoutId}`,
      expect.objectContaining({ stripeSessionId: "cs_test_456" }),
      { ex: 1800 },
    );
    expect(mockSet).toHaveBeenCalledWith(
      "checkout:stripe:cs_test_456",
      checkoutId,
      { ex: 1800 },
    );
  });

  it("returns not_found when the checkout id does not exist", async () => {
    mockGet.mockResolvedValue(null);

    const result = await updatePendingCheckout("missing", {
      status: "failed",
    });

    expect(result).toEqual({ success: false, error: "not_found" });
  });

  it("returns conflict when expectedStatus does not match the stored row", async () => {
    const existing = {
      id: checkoutId,
      status: "paid" as const,
      productId: "1079932",
      date: "2026-07-15",
      startTimeId: 4252139,
      participants: createInput.participants,
      quoteSnapshot: quote,
      contact: createInput.contact,
      handoffTokenDigest: createInput.handoffTokenDigest,
      createdAt: "2026-07-01T12:00:00.000Z",
      expiresAt: "2026-07-01T12:30:00.000Z",
    };
    mockGet.mockResolvedValue(existing);

    const result = await updatePendingCheckout(
      checkoutId,
      { status: "failed" },
      { expectedStatus: "pending" },
    );

    expect(result).toEqual({ success: false, error: "conflict" });
    expect(mockSet).not.toHaveBeenCalled();
  });
});

describe("createPendingCheckout — unavailable", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    getRedisMock.mockReturnValue(null);
  });

  it("returns unavailable when Redis is not configured", async () => {
    const result = await createPendingCheckout(createInput);

    expect(result).toEqual({ success: false, error: "unavailable" });
    expect(mockSet).not.toHaveBeenCalled();
  });
});
