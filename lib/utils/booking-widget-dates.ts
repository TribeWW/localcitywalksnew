/**
 * Date helpers for the booking widget calendar and availabilities fetch (LOC-1048).
 *
 * Aligns local date-picker values with Bókun slot epochs and month-scoped API windows.
 */

import { endOfMonth, format, startOfMonth } from "date-fns";
import type { BokunAvailability } from "@/types/bokun";

/** Formats a `Date` as `YYYY-MM-DD` in local calendar terms. */
export function toIsoDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Converts a Bókun availability slot epoch to `YYYY-MM-DD` (UTC). */
export function availabilitySlotToIsoDate(slot: BokunAvailability): string {
  return format(new Date(slot.date), "yyyy-MM-dd");
}

/** Inclusive month window for availabilities fetch. */
export function getMonthAvailabilityRange(referenceDate: Date): {
  start: string;
  end: string;
} {
  return {
    start: format(startOfMonth(referenceDate), "yyyy-MM-dd"),
    end: format(endOfMonth(referenceDate), "yyyy-MM-dd"),
  };
}
