/**
 * Booking widget submit helpers (LOC-1056).
 *
 * Pure functions for anti-tamper checks, start-time label resolution, and
 * mapping validated submit input to quote requests. Used by
 * `executeSubmitTourBookingRequest` in `booking-widget.actions.ts`.
 */

import type { TourBookingClientQuote, TourBookingSubmitInput } from "@/lib/validation/tour-booking";
import type { TourBookingQuoteInput } from "@/lib/validation/tour-booking";
import type { BokunStartTime, BookingWidgetQuote } from "@/types/bokun";

/**
 * User-facing error when `clientQuote` does not match the server re-quote.
 * Shown in the widget toast; does not expose the server total.
 */
export const BOOKING_WIDGET_PRICE_MISMATCH_ERROR =
  "Price has changed. Please review your total and try again.";

/**
 * Returns whether the client-reported quote matches the server-verified quote.
 *
 * Compares `totalAmount` and `currency` exactly. Email totals always use
 * `serverQuote`, never `clientQuote`.
 *
 * @param clientQuote - Untrusted snapshot attached by the widget UI
 * @param serverQuote - Quote from `computeTourBookingQuote` at submit time
 */
export function clientQuoteMatchesServer(
  clientQuote: TourBookingClientQuote,
  serverQuote: BookingWidgetQuote,
): boolean {
  return (
    clientQuote.totalAmount === serverQuote.totalAmount &&
    clientQuote.currency === serverQuote.currency
  );
}

/**
 * Formats `BokunStartTime` as `HH:mm` for email copy and display labels.
 *
 * @param startTime - Product `startTimes` entry from tour detail
 * @returns Zero-padded 24-hour label (e.g. `"11:00"`)
 */
export function formatBokunStartTimeLabel(startTime: BokunStartTime): string {
  const hour = String(startTime.hour).padStart(2, "0");
  const minute = String(startTime.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * Resolves a display label for the selected Bókun start time id.
 *
 * @param startTimes - Product `startTimes` from `getTourDetailById`
 * @param startTimeId - Selected `startTimes[].id` from the submit payload
 * @returns Formatted `HH:mm` when found, else `"Start time {id}"`
 */
export function resolveStartTimeLabel(
  startTimes: readonly BokunStartTime[] | undefined,
  startTimeId: number,
): string {
  const match = startTimes?.find((startTime) => startTime.id === startTimeId);
  if (match) {
    return formatBokunStartTimeLabel(match);
  }

  return `Start time ${startTimeId}`;
}

/**
 * Maps a validated submit payload to quote pipeline input.
 *
 * Reuses `clientQuote.currency` for the availabilities fetch currency so the
 * server re-quote uses the same ISO code the client displayed.
 *
 * @param submit - Parsed `TourBookingSubmitInput`
 */
export function submitInputToQuoteInput(
  submit: TourBookingSubmitInput,
): TourBookingQuoteInput {
  return {
    productId: submit.productId,
    date: submit.date,
    startTimeId: submit.startTimeId,
    participants: submit.participants,
    language: submit.language,
    currency: submit.clientQuote.currency,
  };
}
