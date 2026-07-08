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
const mockEval = vi.fn();
const getRedisMock = vi.fn();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

vi.mock("@/lib/checkout/pending-checkout-redis", () => ({
  getPendingCheckoutRedis: () => getRedisMock(),
  resetPendingCheckoutRedisClientForTests: vi.fn(),
}));

import {
  claimPendingCheckoutPaidFulfilment,
  createPendingCheckout,
  getPendingCheckoutById,
  getPendingCheckoutByStripeSessionId,
  releasePendingCheckoutPaidFulfilment,
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
    eval: (...args: unknown[]) => mockEval(...args),
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

  it("parses pre-deploy records without handoffTokenDigest", async () => {
    const record = {
      id: checkoutId,
      status: "pending" as const,
      productId: "1079932",
      date: "2026-07-15",
      startTimeId: 4252139,
      participants: createInput.participants,
      quoteSnapshot: quote,
      contact: createInput.contact,
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

describe("claimPendingCheckoutPaidFulfilment", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
    mockEval.mockReset();
  });

  it("returns claimed with a unique fencing token stored as the value", async () => {
    mockSet.mockResolvedValue("OK");

    const result = await claimPendingCheckoutPaidFulfilment(checkoutId);

    expect(result.success).toBe(true);
    if (!result.success || result.outcome !== "claimed") {
      throw new Error("expected claimed outcome");
    }
    expect(result.token).toMatch(UUID_PATTERN);

    // The token is persisted as the claim value (not a constant) so release can
    // compare-and-delete against it.
    expect(mockSet).toHaveBeenCalledWith(
      `checkout:paid-claim:${checkoutId}`,
      result.token,
      { nx: true, ex: 120 },
    );
  });

  it("returns in_progress when the lease is already held", async () => {
    mockSet.mockResolvedValue(null);

    await expect(
      claimPendingCheckoutPaidFulfilment(checkoutId),
    ).resolves.toEqual({ success: true, outcome: "in_progress" });
  });

  it("returns unavailable when Redis is not configured", async () => {
    getRedisMock.mockReturnValue(null);

    await expect(
      claimPendingCheckoutPaidFulfilment(checkoutId),
    ).resolves.toEqual({ success: false, error: "unavailable" });
  });
});

describe("releasePendingCheckoutPaidFulfilment", () => {
  beforeEach(() => {
    mockRedisClient();
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
    mockEval.mockReset();
  });

  it("compare-and-deletes the claim only for the matching fencing token", async () => {
    mockEval.mockResolvedValue(1);

    await releasePendingCheckoutPaidFulfilment(checkoutId, "token-abc");

    expect(mockEval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call"),
      [`checkout:paid-claim:${checkoutId}`],
      ["token-abc"],
    );
    // Never an unconditional DEL that could clear a newer worker's claim.
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("is a no-op when Redis is not configured", async () => {
    getRedisMock.mockReturnValue(null);

    await expect(
      releasePendingCheckoutPaidFulfilment(checkoutId, "token-abc"),
    ).resolves.toBeUndefined();
    expect(mockEval).not.toHaveBeenCalled();
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
