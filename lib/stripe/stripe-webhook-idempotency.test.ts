/**
 * stripeWebhookIdempotency — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockSet = vi.fn();
const getRedisMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-redis", () => ({
  getPendingCheckoutRedis: () => getRedisMock(),
}));

import {
  buildStripeWebhookEventKey,
  hasProcessedStripeWebhookEvent,
  markStripeWebhookEventProcessed,
} from "@/lib/stripe/stripe-webhook-idempotency";

const EVENT_ID = "evt_test_checkout_completed";

describe("stripeWebhookIdempotency", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    getRedisMock.mockReset();
    getRedisMock.mockReturnValue({
      get: (...args: unknown[]) => mockGet(...args),
      set: (...args: unknown[]) => mockSet(...args),
    });
    mockSet.mockResolvedValue("OK");
  });

  it("builds a stable KV key for a Stripe event id", () => {
    expect(buildStripeWebhookEventKey(EVENT_ID)).toBe(
      `checkout:stripe-event:${EVENT_ID}`,
    );
  });

  it("returns false when the event id was not processed", async () => {
    mockGet.mockResolvedValue(null);

    await expect(hasProcessedStripeWebhookEvent(EVENT_ID)).resolves.toBe(false);
    expect(mockGet).toHaveBeenCalledWith(
      `checkout:stripe-event:${EVENT_ID}`,
    );
  });

  it("returns true when the event id was already processed", async () => {
    mockGet.mockResolvedValue("1");

    await expect(hasProcessedStripeWebhookEvent(EVENT_ID)).resolves.toBe(true);
  });

  it("marks an event id as processed with TTL", async () => {
    await expect(markStripeWebhookEventProcessed(EVENT_ID)).resolves.toEqual({
      success: true,
    });

    expect(mockSet).toHaveBeenCalledWith(
      `checkout:stripe-event:${EVENT_ID}`,
      "1",
      expect.objectContaining({ ex: expect.any(Number) }),
    );
  });

  it("returns unavailable when Redis is not configured", async () => {
    getRedisMock.mockReturnValue(null);

    await expect(markStripeWebhookEventProcessed(EVENT_ID)).resolves.toEqual({
      success: false,
      error: "unavailable",
    });
  });
});
