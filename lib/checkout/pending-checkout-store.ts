/**
 * Ephemeral pending checkout persistence in Upstash Redis (LOC-1159).
 *
 * Created when the customer clicks Pay (after Bókun reserve). Indexed by
 * internal checkout id and Stripe Checkout Session id for webhook correlation.
 */

import { randomUUID } from "crypto";
import { z } from "zod";

import { CHECKOUT_HANDOFF_TTL_SECONDS } from "@/lib/checkout/handoff-token";
import { getPendingCheckoutRedis } from "@/lib/checkout/pending-checkout-redis";
import {
  tourBookingParticipantsSchema,
  tourBookingProductIdSchema,
  tourBookingStartTimeIdSchema,
} from "@/lib/validation/tour-booking";
import type {
  BookingWidgetParticipants,
  BookingWidgetQuote,
} from "@/types/bokun";

/** KV key prefix for checkout records keyed by internal id. */
export const PENDING_CHECKOUT_KEY_PREFIX = "checkout:pending:";

/** KV key prefix for Stripe session id → checkout id index. */
export const PENDING_CHECKOUT_STRIPE_INDEX_PREFIX = "checkout:stripe:";

/** KV key prefix for the atomic paid-fulfilment claim (one winner per checkout). */
export const PENDING_CHECKOUT_PAID_CLAIM_PREFIX = "checkout:paid-claim:";

/**
 * Lease TTL for the paid-fulfilment claim.
 *
 * Long enough to block a concurrent burst of duplicate webhook deliveries while
 * one worker confirms Bókun, yet short enough that a later Stripe retry (minutes
 * apart) can re-acquire and recover a failed fulfilment.
 */
export const PENDING_CHECKOUT_PAID_CLAIM_TTL_SECONDS = 120;

/**
 * Maximum webhook fulfilment attempts before escalating to ops.
 *
 * Used to prevent indefinite Stripe retries when Bókun confirmation repeatedly
 * fails after payment (paid-but-unfulfilled; LOC-1168).
 */
export const PENDING_CHECKOUT_FULFILMENT_MAX_ATTEMPTS = 5;

/** Lifecycle status for a pending checkout row. */
export type PendingCheckoutStatus = "pending" | "paid" | "failed" | "expired";

/** Contact captured on the checkout summary page before Pay. */
export interface PendingCheckoutContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  comments?: string;
  /** ISO timestamp when terms were accepted. */
  termsAcceptedAt: string;
}

/** Ephemeral checkout row stored from Pay click through fulfilment. */
export interface PendingCheckoutRecord {
  id: string;
  status: PendingCheckoutStatus;
  productId: string;
  date: string;
  startTimeId: number;
  participants: BookingWidgetParticipants;
  language?: string;
  quoteSnapshot: BookingWidgetQuote;
  contact: PendingCheckoutContact;
  bokunConfirmationCode?: string;
  /** HMAC digest of the handoff token active when Pay was clicked. */
  handoffTokenDigest?: string;
  stripeSessionId?: string;
  bokunBookingId?: string;
  productConfirmationCode?: string;
  /**
   * Number of failed fulfilment attempts after Stripe marked the checkout paid.
   *
   * Used to bound webhook retries and escalate "paid-but-unfulfilled" cases to
   * ops after repeated confirmation failures (LOC-1168).
   */
  fulfilmentAttemptCount?: number;
  /** Most recent fulfilment error code for ops triage (e.g. "confirm_failed"). */
  fulfilmentLastError?: string;
  /** ISO timestamp when the most recent fulfilment error was recorded. */
  fulfilmentLastErrorAt?: string;
  createdAt: string;
  expiresAt: string;
}

/** Input for creating a new pending checkout row. */
export interface CreatePendingCheckoutInput {
  /** Optional predetermined id — used as Bókun `externalBookingReference`. */
  id?: string;
  productId: string;
  date: string;
  startTimeId: number;
  participants: BookingWidgetParticipants;
  language?: string;
  quoteSnapshot: BookingWidgetQuote;
  contact: PendingCheckoutContact;
  bokunConfirmationCode?: string;
  handoffTokenDigest: string;
}

/** Partial update applied via `updatePendingCheckout`. */
export type UpdatePendingCheckoutInput = Partial<
  Pick<
    PendingCheckoutRecord,
    | "status"
    | "quoteSnapshot"
    | "contact"
    | "bokunConfirmationCode"
    | "stripeSessionId"
    | "bokunBookingId"
    | "productConfirmationCode"
    | "fulfilmentAttemptCount"
    | "fulfilmentLastError"
    | "fulfilmentLastErrorAt"
    | "expiresAt"
  >
>;

export type CreatePendingCheckoutResult =
  | { success: true; data: PendingCheckoutRecord }
  | { success: false; error: "unavailable" };

/** Optional guards for `updatePendingCheckout`. */
export interface UpdatePendingCheckoutOptions {
  /** Update applies only when the stored row still has this status. */
  expectedStatus?: PendingCheckoutStatus;
}

export type UpdatePendingCheckoutResult =
  | { success: true; data: PendingCheckoutRecord }
  | { success: false; error: "unavailable" | "not_found" | "conflict" };

const pendingCheckoutContactSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  comments: z.string().trim().optional(),
  termsAcceptedAt: z.string().datetime(),
});

const bookingWidgetQuoteSchema = z.object({
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().trim().min(3).max(3),
  source: z.literal("bokun-availability"),
  breakdown: z.array(
    z.object({
      categoryId: z.number(),
      categoryLabel: z.string(),
      count: z.number().int().nonnegative(),
      unitAmount: z.number().finite().nonnegative(),
      lineTotal: z.number().finite().nonnegative(),
      currency: z.string().trim().min(3).max(3),
    }),
  ),
});

const pendingCheckoutRecordSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "paid", "failed", "expired"]),
  productId: tourBookingProductIdSchema,
  date: z.string(),
  startTimeId: tourBookingStartTimeIdSchema,
  participants: tourBookingParticipantsSchema,
  language: z.string().trim().min(2).max(16).optional(),
  quoteSnapshot: bookingWidgetQuoteSchema,
  contact: pendingCheckoutContactSchema,
  bokunConfirmationCode: z.string().trim().min(1).optional(),
  handoffTokenDigest: z.string().trim().min(1).optional(),
  stripeSessionId: z.string().trim().min(1).optional(),
  bokunBookingId: z.string().trim().min(1).optional(),
  productConfirmationCode: z.string().trim().min(1).optional(),
  fulfilmentAttemptCount: z.number().int().nonnegative().optional(),
  fulfilmentLastError: z.string().trim().min(1).optional(),
  fulfilmentLastErrorAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

/**
 * Builds the primary KV key for a pending checkout id.
 *
 * @param checkoutId - Internal checkout uuid
 */
export function buildPendingCheckoutKey(checkoutId: string): string {
  return `${PENDING_CHECKOUT_KEY_PREFIX}${checkoutId}`;
}

/**
 * Builds the Stripe session index key pointing at a checkout id.
 *
 * @param stripeSessionId - Stripe Checkout Session id
 */
export function buildPendingCheckoutStripeIndexKey(
  stripeSessionId: string,
): string {
  return `${PENDING_CHECKOUT_STRIPE_INDEX_PREFIX}${stripeSessionId}`;
}

/**
 * Builds the atomic paid-fulfilment claim key for a checkout id.
 *
 * @param checkoutId - Internal checkout uuid
 */
export function buildPendingCheckoutPaidClaimKey(checkoutId: string): string {
  return `${PENDING_CHECKOUT_PAID_CLAIM_PREFIX}${checkoutId}`;
}

/** Outcome of an atomic paid-fulfilment claim attempt. */
export type ClaimPendingCheckoutPaidResult =
  | { success: true; outcome: "claimed"; token: string }
  | { success: true; outcome: "in_progress" }
  | { success: false; error: "unavailable" };

/**
 * Lua compare-and-delete: only remove the claim when the stored fencing token
 * still matches the caller's token, so a stale worker whose lease already
 * expired cannot delete a newer worker's active claim.
 */
const RELEASE_PAID_CLAIM_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

/**
 * Atomically claims the right to confirm payment + fulfilment for a checkout.
 *
 * Uses Redis `SET … NX EX` with a unique per-attempt fencing token as the value
 * so exactly one concurrent webhook delivery wins the claim (`outcome:
 * "claimed"`) and receives the `token`; losers observe `outcome: "in_progress"`
 * and must exit without advancing the checkout. The claim expires so a later
 * retry can recover a fulfilment that failed after payment was recorded. The
 * returned token must be passed to `releasePendingCheckoutPaidFulfilment`.
 *
 * @param checkoutId - Internal checkout uuid
 * @param ttlSeconds - Lease duration in seconds
 */
export async function claimPendingCheckoutPaidFulfilment(
  checkoutId: string,
  ttlSeconds: number = PENDING_CHECKOUT_PAID_CLAIM_TTL_SECONDS,
): Promise<ClaimPendingCheckoutPaidResult> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return { success: false, error: "unavailable" };
  }

  const token = randomUUID();

  try {
    const claimed = await redis.set(
      buildPendingCheckoutPaidClaimKey(checkoutId),
      token,
      { nx: true, ex: ttlSeconds },
    );

    if (claimed === "OK") {
      return { success: true, outcome: "claimed", token };
    }

    return { success: true, outcome: "in_progress" };
  } catch (error) {
    console.error(
      `[pending-checkout-store] failed to claim paid-fulfilment for ${checkoutId}`,
      error,
    );
    return { success: false, error: "unavailable" };
  }
}

/**
 * Releases the atomic paid-fulfilment claim for a checkout id.
 *
 * Called when fulfilment fails so a Stripe retry can immediately re-acquire the
 * claim instead of waiting for the lease TTL to expire. Uses an atomic
 * compare-and-delete keyed on the fencing `token` returned by
 * `claimPendingCheckoutPaidFulfilment`, so a stale worker cannot clear a newer
 * active claim. A no-op when Redis is unconfigured (the lease expires on its
 * own).
 *
 * @param checkoutId - Internal checkout uuid
 * @param token - Fencing token returned when the claim was won
 */
export async function releasePendingCheckoutPaidFulfilment(
  checkoutId: string,
  token: string,
): Promise<void> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.eval(
      RELEASE_PAID_CLAIM_SCRIPT,
      [buildPendingCheckoutPaidClaimKey(checkoutId)],
      [token],
    );
  } catch (error) {
    console.error(
      `[pending-checkout-store] failed to release paid-fulfilment claim for ${checkoutId}`,
      error,
    );
  }
}

export type RecordPaidFulfilmentFailureResult =
  | { success: true; attemptCount: number; exhausted: boolean }
  | { success: false; error: "unavailable" | "not_found" | "conflict" };

/**
 * Records a fulfilment failure after Stripe marked a checkout paid.
 *
 * Increments the attempt count and, once max attempts are reached, marks the
 * row as `failed` so the success page can show support guidance and Stripe
 * retries can stop.
 *
 * @param checkoutId - Internal pending checkout uuid
 * @param error - Failure code (e.g. "confirm_failed") for ops triage
 */
export async function recordPaidFulfilmentFailure(
  checkoutId: string,
  error: string,
): Promise<RecordPaidFulfilmentFailureResult> {
  const existing = await getPendingCheckoutById(checkoutId);
  if (!existing) {
    return { success: false, error: "not_found" };
  }

  const nextAttempt = (existing.fulfilmentAttemptCount ?? 0) + 1;
  const exhausted = nextAttempt >= PENDING_CHECKOUT_FULFILMENT_MAX_ATTEMPTS;

  const updateResult = await updatePendingCheckout(checkoutId, {
    fulfilmentAttemptCount: nextAttempt,
    fulfilmentLastError: error,
    fulfilmentLastErrorAt: new Date().toISOString(),
    ...(exhausted ? { status: "failed" as const } : {}),
  });

  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  return { success: true, attemptCount: nextAttempt, exhausted };
}
/**
 * Computes KV TTL seconds from `expiresAt`, capped at handoff TTL.
 *
 * @param expiresAt - ISO expiry timestamp on the record
 */
export function resolvePendingCheckoutTtlSeconds(expiresAt: string): number {
  const remainingMs = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return 1;
  }

  return Math.min(
    CHECKOUT_HANDOFF_TTL_SECONDS,
    Math.max(1, Math.ceil(remainingMs / 1000)),
  );
}

function parsePendingCheckoutRecord(
  value: unknown,
): PendingCheckoutRecord | null {
  const parsed = pendingCheckoutRecordSchema.safeParse(value);
  if (!parsed.success) {
    console.error(
      "[pending-checkout-store] invalid stored record:",
      parsed.error.issues[0]?.message,
    );
    return null;
  }

  return parsed.data;
}

/**
 * Creates a pending checkout row after Bókun reserve (Phase 3 Pay click).
 *
 * @param input - Slot selection, quote snapshot, contact, optional reserve code
 */
export async function createPendingCheckout(
  input: CreatePendingCheckoutInput,
): Promise<CreatePendingCheckoutResult> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return { success: false, error: "unavailable" };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CHECKOUT_HANDOFF_TTL_SECONDS * 1000,
  );

  const record: PendingCheckoutRecord = {
    id: input.id ?? randomUUID(),
    status: "pending",
    productId: input.productId,
    date: input.date,
    startTimeId: input.startTimeId,
    participants: input.participants,
    language: input.language,
    quoteSnapshot: input.quoteSnapshot,
    contact: input.contact,
    bokunConfirmationCode: input.bokunConfirmationCode,
    handoffTokenDigest: input.handoffTokenDigest,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const ttlSeconds = resolvePendingCheckoutTtlSeconds(record.expiresAt);
  await redis.set(buildPendingCheckoutKey(record.id), record, {
    ex: ttlSeconds,
  });

  return { success: true, data: record };
}

/**
 * Loads a pending checkout by internal id.
 *
 * @param checkoutId - Internal checkout uuid
 */
export async function getPendingCheckoutById(
  checkoutId: string,
): Promise<PendingCheckoutRecord | null> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return null;
  }

  const value = await redis.get(buildPendingCheckoutKey(checkoutId));
  return parsePendingCheckoutRecord(value);
}

/**
 * Loads a pending checkout via Stripe Checkout Session id index.
 *
 * @param stripeSessionId - Stripe Checkout Session id from webhook metadata
 */
export async function getPendingCheckoutByStripeSessionId(
  stripeSessionId: string,
): Promise<PendingCheckoutRecord | null> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return null;
  }

  const checkoutId = await redis.get<string>(
    buildPendingCheckoutStripeIndexKey(stripeSessionId),
  );
  if (!checkoutId || typeof checkoutId !== "string") {
    return null;
  }

  return getPendingCheckoutById(checkoutId);
}

/**
 * Merges an update into an existing pending checkout row.
 *
 * Refreshes TTL and maintains the Stripe session index when `stripeSessionId`
 * is set or changed.
 *
 * @param checkoutId - Internal checkout uuid
 * @param update - Fields to merge into the stored record
 * @param options - Optional optimistic concurrency guard on current status
 */
export async function updatePendingCheckout(
  checkoutId: string,
  update: UpdatePendingCheckoutInput,
  options?: UpdatePendingCheckoutOptions,
): Promise<UpdatePendingCheckoutResult> {
  const redis = getPendingCheckoutRedis();
  if (!redis) {
    return { success: false, error: "unavailable" };
  }

  const existing = await getPendingCheckoutById(checkoutId);
  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (
    options?.expectedStatus !== undefined &&
    existing.status !== options.expectedStatus
  ) {
    return { success: false, error: "conflict" };
  }

  const merged: PendingCheckoutRecord = {
    ...existing,
    ...update,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  const ttlSeconds = resolvePendingCheckoutTtlSeconds(merged.expiresAt);
  await redis.set(buildPendingCheckoutKey(checkoutId), merged, {
    ex: ttlSeconds,
  });

  if (update.stripeSessionId) {
    await redis.set(
      buildPendingCheckoutStripeIndexKey(update.stripeSessionId),
      checkoutId,
      { ex: ttlSeconds },
    );
  }

  return { success: true, data: merged };
}
