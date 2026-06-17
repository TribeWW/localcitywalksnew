/**
 * In-process delivery ledger for booking-widget emails (LOC-1055 / LOC-1056).
 *
 * Tracks which email legs (team / customer) succeeded for a given booking
 * fingerprint so `sendBookingWidgetRequestEmails` can resume after a partial
 * failure without re-sending the team notification.
 *
 * **Scope:** Process-local memory with TTL — not durable across serverless
 * cold starts or multiple instances. A database outbox would be needed for
 * cross-instance exactly-once delivery.
 */

import type { BookingWidgetEmailContent } from "@/lib/nodemailer/booking-widget-email";

/** Which recipient leg of a booking-widget email send. */
export type BookingWidgetEmailDeliveryLeg = "team" | "customer";

/** Per-booking delivery flags for team and customer emails. */
export interface BookingWidgetEmailDeliveryState {
  team: boolean;
  customer: boolean;
  updatedAt: number;
}

/** TTL for ledger entries (24 hours). */
const LEDGER_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum interval between full ledger sweeps (1 minute). */
const PRUNE_INTERVAL_MS = 60_000;

const deliveryLedger = new Map<string, BookingWidgetEmailDeliveryState>();

/** Per-key promise chains — serialize concurrent senders for the same booking. */
const keyDeliveryChains = new Map<string, Promise<unknown>>();

let lastLedgerPruneAt = 0;

function isFresh(entry: BookingWidgetEmailDeliveryState, now = Date.now()): boolean {
  return now - entry.updatedAt < LEDGER_TTL_MS;
}

function pruneExpiredDeliveryLedgerEntries(now = Date.now()): void {
  for (const [key, entry] of deliveryLedger) {
    if (!isFresh(entry, now)) {
      deliveryLedger.delete(key);
    }
  }
}

function maybePruneExpiredDeliveryLedgerEntries(now = Date.now()): void {
  if (now - lastLedgerPruneAt < PRUNE_INTERVAL_MS) {
    return;
  }

  lastLedgerPruneAt = now;
  pruneExpiredDeliveryLedgerEntries(now);
}

/**
 * Builds a stable idempotency key from verified booking email content.
 *
 * Intentionally excludes mutable optional fields (e.g. message, phone) so a
 * user retry after a partial SMTP failure targets the same booking attempt.
 */
export function buildBookingWidgetEmailDeliveryKey(
  data: BookingWidgetEmailContent,
): string {
  return [
    data.productId,
    data.date,
    String(data.startTimeId),
    data.email.trim().toLowerCase(),
    String(data.totalAmount),
    data.currency,
    String(data.adults),
    String(data.youth),
    String(data.children),
    String(data.infants),
  ].join("|");
}

/**
 * Returns delivery state for a booking fingerprint, pruning expired entries.
 *
 * @param key - From `buildBookingWidgetEmailDeliveryKey`
 */
export function getBookingWidgetEmailDeliveryState(
  key: string,
): BookingWidgetEmailDeliveryState {
  maybePruneExpiredDeliveryLedgerEntries();

  const existing = deliveryLedger.get(key);
  if (existing && isFresh(existing)) {
    return existing;
  }

  if (existing) {
    deliveryLedger.delete(key);
  }

  return { team: false, customer: false, updatedAt: Date.now() };
}

/**
 * Runs `task` exclusively for a booking fingerprint.
 *
 * Concurrent callers with the same key queue behind the in-flight send so
 * read/modify/write in the email orchestrator cannot interleave at `await`.
 */
export function runWithBookingWidgetEmailDeliveryLock<T>(
  key: string,
  task: () => Promise<T> | T,
): Promise<T> {
  const previous = keyDeliveryChains.get(key) ?? Promise.resolve();
  const run = previous
    .catch(() => undefined)
    .then(() => task());

  keyDeliveryChains.set(key, run);

  return run.finally(() => {
    if (keyDeliveryChains.get(key) === run) {
      keyDeliveryChains.delete(key);
    }
  }) as Promise<T>;
}

/**
 * Records that a delivery leg completed successfully.
 *
 * @param key - Booking fingerprint key
 * @param leg - `"team"` or `"customer"`
 */
export function markBookingWidgetEmailDelivered(
  key: string,
  leg: BookingWidgetEmailDeliveryLeg,
): void {
  maybePruneExpiredDeliveryLedgerEntries();

  const current = getBookingWidgetEmailDeliveryState(key);
  deliveryLedger.set(key, {
    ...current,
    [leg]: true,
    updatedAt: Date.now(),
  });
}

/** Clears the in-process ledger — for tests only. */
export function resetBookingWidgetEmailDeliveryLedger(): void {
  deliveryLedger.clear();
  keyDeliveryChains.clear();
  lastLedgerPruneAt = 0;
}

/** Ledger entry count — for tests only. */
export function getBookingWidgetEmailDeliveryLedgerSizeForTests(): number {
  return deliveryLedger.size;
}
