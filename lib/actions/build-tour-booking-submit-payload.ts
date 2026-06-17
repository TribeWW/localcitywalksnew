/**
 * Maps booking widget form state to `TourBookingSubmitInput` (LOC-1056).
 *
 * Client-side helper used by `BookingWidget` before calling `submitTourBookingRequest`.
 * The server re-validates via Zod, re-quotes via Bókun, and checks `clientQuote`
 * for tampering — this mapper only shapes the request.
 */

import { format } from "date-fns";
import type { TourBookingSubmitInput } from "@/lib/validation/tour-booking";
import type { BookingWidgetQuote } from "@/types/bokun";

/**
 * Minimal widget form slice required to build a submit payload.
 * Mirrors `BookingWidgetFormValues` without importing the client component.
 */
export interface BookingWidgetSubmitFormValues {
  fullName: string;
  email: string;
  phoneNumber?: string;
  message?: string;
  /** Locked city from bootstrap / hidden form field. */
  city: string;
  adults: number;
  youth: number;
  children: number;
  infants: number;
  /** Selected tour date from the date picker. */
  preferredDate?: Date;
  /** Selected `startTimes[].id` as string (form control value). */
  startTimeId?: string;
  /** Bókun guided language code when applicable. */
  language?: string;
  consent: boolean;
}

/** Inputs for `buildTourBookingSubmitPayload`. */
export interface BuildTourBookingSubmitPayloadInput {
  /** Current react-hook-form values from `BookingWidget`. */
  values: BookingWidgetSubmitFormValues;
  /** Bókun activity id from bootstrap (not user-editable). */
  productId: string;
  /** Product title from bootstrap for email copy. */
  productTitle: string;
  /** Live quote shown in the widget; attached as `clientQuote` for anti-tamper. */
  quote: BookingWidgetQuote;
}

/**
 * Builds the server-action submit payload from widget form state and the live quote.
 *
 * Converts `preferredDate` → ISO `YYYY-MM-DD` and `startTimeId` string → number.
 * Omits blank optional `message` and `phoneNumber`.
 *
 * @param input.values - Widget form state at submit time
 * @param input.productId - Bókun product id from bootstrap
 * @param input.productTitle - Display title for emails
 * @param input.quote - Current debounced quote from `getTourBookingQuote`
 * @returns Parsed-ready `TourBookingSubmitInput` for `submitTourBookingRequest`
 * @throws Error when `preferredDate` or `startTimeId` are missing
 */
export function buildTourBookingSubmitPayload({
  values,
  productId,
  productTitle,
  quote,
}: BuildTourBookingSubmitPayloadInput): TourBookingSubmitInput {
  if (!values.preferredDate) {
    throw new Error("Missing tour date");
  }

  const startTimeId = values.startTimeId
    ? Number(values.startTimeId)
    : Number.NaN;

  if (!Number.isFinite(startTimeId) || startTimeId <= 0) {
    throw new Error("Missing start time");
  }

  const trimmedMessage = values.message?.trim();

  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phoneNumber: values.phoneNumber?.trim() || undefined,
    message: trimmedMessage ? trimmedMessage : undefined,
    city: values.city.trim(),
    productId: productId.trim(),
    productTitle: productTitle.trim(),
    date: format(values.preferredDate, "yyyy-MM-dd"),
    startTimeId,
    language: values.language?.trim() || undefined,
    participants: {
      adults: values.adults,
      youth: values.youth,
      children: values.children,
      infants: values.infants,
    },
    clientQuote: {
      totalAmount: quote.totalAmount,
      currency: quote.currency,
    },
    consent: values.consent,
  };
}
