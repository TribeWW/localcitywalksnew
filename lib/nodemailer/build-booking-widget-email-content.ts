/**
 * Maps validated submit input and server-verified quote to email payload (LOC-1055).
 *
 * Used by `submitTourBookingRequest` (LOC-1056) immediately before
 * `sendBookingWidgetRequestEmails`. Never reads `clientQuote` for totals.
 */

import type { BookingWidgetEmailContent } from "@/lib/nodemailer/booking-widget-email";
import type { TourBookingSubmitInput } from "@/lib/validation/tour-booking";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Inputs for `buildBookingWidgetEmailContent`. */
export interface BuildBookingWidgetEmailContentInput {
  /** Zod-validated submit payload from the booking widget. */
  submit: TourBookingSubmitInput;
  /** Server-recomputed quote; source of truth for totals in emails. */
  quote: BookingWidgetQuote;
  /** Human-readable start time label (e.g. `"11:00"`). */
  startTimeLabel: string;
  /** Resolved product title for email copy. */
  productTitle: string;
  /** Read-only duration from product bootstrap, when available. */
  durationText?: string;
}

/**
 * Builds the normalized email payload from submit input and verified quote.
 *
 * @param input.submit - Validated widget submit fields (contact + slot + participants)
 * @param input.quote - Server quote from `calculateBookingQuote`
 * @param input.startTimeLabel - Display time resolved from product `startTimes`
 * @param input.productTitle - Final title for team/customer copy
 * @param input.durationText - Optional duration string from product detail
 */
export function buildBookingWidgetEmailContent({
  submit,
  quote,
  startTimeLabel,
  productTitle,
  durationText,
}: BuildBookingWidgetEmailContentInput): BookingWidgetEmailContent {
  return {
    fullName: submit.fullName,
    email: submit.email,
    phoneNumber: submit.phoneNumber,
    message: submit.message,
    consent: submit.consent,
    city: submit.city,
    productId: submit.productId,
    productTitle,
    date: submit.date,
    startTimeId: submit.startTimeId,
    startTimeLabel,
    language: submit.language,
    durationText,
    adults: submit.participants.adults,
    youth: submit.participants.youth,
    children: submit.participants.children,
    infants: submit.participants.infants,
    totalAmount: quote.totalAmount,
    currency: quote.currency,
    breakdown: quote.breakdown.map((line) => ({
      categoryLabel: line.categoryLabel,
      count: line.count,
      lineTotal: line.lineTotal,
      currency: line.currency,
    })),
  };
}
