/**
 * stripeWebhookIdempotency — red/green TDD specs (LOC-1165 / PRD Task 4.2).
 *
 * Critical invariants:
 * - A Stripe event is claimed with a single atomic `SET … NX EX`
 * - Concurrent duplicates observe `duplicate` and cannot re-run fulfilment
 * - The claim uses a Stripe-specific TTL, independent of the handoff TTL
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSet = vi.fn();
const mockDel = vi.fn();
const getRedisMock = vi.fn();

vi.mock("@/lib/checkout/pending-checkout-redis", () => ({
  getPendingCheckoutRedis: () => getRedisMock(),
}));

import {
  STRIPE_WEBHOOK_EVENT_TTL_SECONDS,
  buildStripeWebhookEventKey,
  claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim,
} from "@/lib/stripe/stripe-webhook-idempotency";

const EVENT_ID = "evt_test_checkout_completed";
const EVENT_KEY = `checkout:stripe-event:${EVENT_ID}`;

describe("stripeWebhookIdempotency", () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockDel.mockReset();
    getRedisMock.mockReset();
    getRedisMock.mockReturnValue({
      set: (...args: unknown[]) => mockSet(...args),
      del: (...args: unknown[]) => mockDel(...args),
    });
  });

  it("builds a stable KV key for a Stripe event id", () => {
    expect(buildStripeWebhookEventKey(EVENT_ID)).toBe(EVENT_KEY);
  });

  it("uses a Stripe-specific TTL longer than the 30-minute handoff TTL", () => {
    expect(STRIPE_WEBHOOK_EVENT_TTL_SECONDS).toBeGreaterThan(1800);
  });

  it("claims an event with a single atomic NX + EX set", async () => {
    mockSet.mockResolvedValue("OK");

    await expect(claimStripeWebhookEvent(EVENT_ID)).resolves.toEqual({
      success: true,
      outcome: "claimed",
    });

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(EVENT_KEY, "1", {
      nx: true,
      ex: STRIPE_WEBHOOK_EVENT_TTL_SECONDS,
    });
  });

  it("reports duplicate when the event id was already claimed", async () => {
    mockSet.mockResolvedValue(null);

    await expect(claimStripeWebhookEvent(EVENT_ID)).resolves.toEqual({
      success: true,
      outcome: "duplicate",
    });
  });

  it("returns unavailable when Redis is not configured", async () => {
    getRedisMock.mockReturnValue(null);

    await expect(claimStripeWebhookEvent(EVENT_ID)).resolves.toEqual({
      success: false,
      error: "unavailable",
    });
  });

  it("releases a claim by deleting the event key", async () => {
    mockDel.mockResolvedValue(1);

    await releaseStripeWebhookEventClaim(EVENT_ID);

    expect(mockDel).toHaveBeenCalledWith(EVENT_KEY);
  });

  it("release is a no-op when Redis is not configured", async () => {
    getRedisMock.mockReturnValue(null);

    await expect(
      releaseStripeWebhookEventClaim(EVENT_ID),
    ).resolves.toBeUndefined();
    expect(mockDel).not.toHaveBeenCalled();
  });
});
