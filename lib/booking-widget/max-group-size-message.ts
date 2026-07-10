/**
 * Max group size copy and error codes for the booking widget quote pipeline.
 */

import type { BookingWidgetMaxGroupSizeErrorCode } from "@/types/bokun";

/** Machine-readable quote failure when total participants exceed `maxPerBooking`. */
export const BOOKING_WIDGET_MAX_GROUP_SIZE_ERROR_CODE: BookingWidgetMaxGroupSizeErrorCode =
  "max_group_size_exceeded";

/** Homepage contact section — matches Navbar `CONTACT_HREF`. */
export const BOOKING_WIDGET_CONTACT_HREF = "/#contact";

/** Structured quote error for max group size overflow. */
export interface BookingWidgetMaxGroupSizeQuoteError {
  code: typeof BOOKING_WIDGET_MAX_GROUP_SIZE_ERROR_CODE;
  maxGroupSize: number;
}

/** Union of quote error states shown in `BookingWidgetBreakdown`. */
export type BookingWidgetQuoteErrorState =
  | string
  | BookingWidgetMaxGroupSizeQuoteError
  | null;

/**
 * Plain-text max group size message for server responses and logs.
 *
 * @param maxGroupSize - Bókun `maxPerBooking` for the selected slot
 */
export function formatMaxGroupSizeMessage(maxGroupSize: number): string {
  return `Max group size is ${maxGroupSize}. For larger groups, please request a custom quote.`;
}

/**
 * Type guard for structured max group size quote errors.
 */
export function isMaxGroupSizeQuoteError(
  error: BookingWidgetQuoteErrorState,
): error is BookingWidgetMaxGroupSizeQuoteError {
  return (
    error != null &&
    typeof error === "object" &&
    error.code === BOOKING_WIDGET_MAX_GROUP_SIZE_ERROR_CODE &&
    Number.isFinite(error.maxGroupSize)
  );
}

/**
 * Sums widget participant counters.
 */
export function sumBookingWidgetParticipants(participants: {
  adults: number;
  youth: number;
  children: number;
  infants: number;
}): number {
  return (
    participants.adults +
    participants.youth +
    participants.children +
    participants.infants
  );
}
