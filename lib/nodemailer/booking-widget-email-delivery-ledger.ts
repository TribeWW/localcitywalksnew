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

const deliveryLedger = new Map<string, BookingWidgetEmailDeliveryState>();

function isFresh(entry: BookingWidgetEmailDeliveryState, now = Date.now()): boolean {
  return now - entry.updatedAt < LEDGER_TTL_MS;
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
 * Records that a delivery leg completed successfully.
 *
 * @param key - Booking fingerprint key
 * @param leg - `"team"` or `"customer"`
 */
export function markBookingWidgetEmailDelivered(
  key: string,
  leg: BookingWidgetEmailDeliveryLeg,
): void {
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
}
