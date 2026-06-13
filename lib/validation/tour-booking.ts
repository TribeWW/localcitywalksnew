/**
 * Zod validation for the booking widget quote and submit flows (LOC-1046).
 *
 * Consumed by `booking-widget.actions.ts` (LOC-1047). Tour-page widget uses Bókun
 * `startTimeId` (number) — not legacy `preferredTime` strings from `TourRequestSchema`.
 * No `tourDuration`; duration is read-only from product `durationText`.
 *
 * Submit payloads include `clientQuote` for shape validation; `submitTourBookingRequest`
 * (LOC-1056) re-computes the quote server-side and rejects price mismatches.
 */

import { z } from "zod";

/**
 * Safe Bókun product id pattern — blocks path/query injection.
 * Aligned with `SAFE_ID_REGEX` in `tour-detail.actions.ts`.
 */
export const SAFE_BOKUN_PRODUCT_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/** Maximum participants allowed per widget counter (matches legacy tour request form). */
const MAX_PARTICIPANTS_PER_CATEGORY = 20;

/**
 * ISO calendar date format accepted by quote and submit actions (`YYYY-MM-DD`).
 * Parsed as UTC midnight for date-window checks.
 */
export const TOUR_BOOKING_ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Parses an ISO date string as UTC midnight. */
function parseIsoDateUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** True when the date is today or later (UTC). */
function isTodayOrFutureUtc(date: string): boolean {
  const selected = parseIsoDateUtc(date);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return selected >= today;
}

/** True when the date falls within one year from today (UTC). */
function isWithinOneYearUtc(date: string): boolean {
  const selected = parseIsoDateUtc(date);
  const limit = new Date();
  limit.setUTCHours(0, 0, 0, 0);
  limit.setUTCFullYear(limit.getUTCFullYear() + 1);
  return selected <= limit;
}

/** Booking date: ISO format, today → +1 year (aligned with `TourRequestSchema`). */
const tourBookingIsoDateSchema = z
  .string()
  .trim()
  .regex(TOUR_BOOKING_ISO_DATE_REGEX, {
    message: "Please provide a valid date (YYYY-MM-DD)",
  })
  .refine(isTodayOrFutureUtc, {
    message: "Please select a future date for your tour",
  })
  .refine(isWithinOneYearUtc, {
    message: "Please select a date within the next year",
  });

/** Optional international phone — same rules as legacy `TourRequestSchema`. */
const tourBookingPhoneSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === "") {
        return true;
      }

      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      return phoneRegex.test(value.replace(/\s/g, ""));
    },
    {
      message:
        "Please enter a valid phone number with country code (e.g., +1 234 567 8900)",
    },
  );

/**
 * Widget participant counters: adults, youth, children, infants.
 * Requires at least one participant total; max 20 per category.
 */
export const tourBookingParticipantsSchema = z
  .object({
    adults: z
      .number()
      .int()
      .min(0, { message: "Adults cannot be negative" })
      .max(MAX_PARTICIPANTS_PER_CATEGORY, {
        message: `Maximum ${MAX_PARTICIPANTS_PER_CATEGORY} adults per tour`,
      }),
    youth: z
      .number()
      .int()
      .min(0, { message: "Youth cannot be negative" })
      .max(MAX_PARTICIPANTS_PER_CATEGORY, {
        message: `Maximum ${MAX_PARTICIPANTS_PER_CATEGORY} youth per tour`,
      }),
    children: z
      .number()
      .int()
      .min(0, { message: "Children cannot be negative" })
      .max(MAX_PARTICIPANTS_PER_CATEGORY, {
        message: `Maximum ${MAX_PARTICIPANTS_PER_CATEGORY} children per tour`,
      }),
    infants: z
      .number()
      .int()
      .min(0, { message: "Infants cannot be negative" })
      .max(MAX_PARTICIPANTS_PER_CATEGORY, {
        message: `Maximum ${MAX_PARTICIPANTS_PER_CATEGORY} infants per tour`,
      }),
  })
  .refine(
    (participants) =>
      participants.adults +
        participants.youth +
        participants.children +
        participants.infants >
      0,
    {
      message: "Please select at least one participant for the tour",
      path: ["adults"],
    },
  );

/** Trimmed Bókun activity id validated against `SAFE_BOKUN_PRODUCT_ID_REGEX`. */
export const tourBookingProductIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Invalid product id" })
  .regex(SAFE_BOKUN_PRODUCT_ID_REGEX, { message: "Invalid product id" });

/**
 * Bókun `startTimes[].id` for the selected slot.
 * Dynamic per product — not a hard-coded `preferredTime` string.
 */
export const tourBookingStartTimeIdSchema = z
  .number()
  .int({ message: "Please select a valid start time" })
  .positive({ message: "Please select a valid start time" });

/**
 * Client-reported quote snapshot attached to submit payloads.
 * Validates shape only; server re-computes and rejects tampered totals (LOC-1056).
 */
export const tourBookingClientQuoteSchema = z.object({
  /** Non-negative finite total from the widget price summary. */
  totalAmount: z
    .number()
    .finite({ message: "Invalid total price" })
    .nonnegative({ message: "Invalid total price" }),
  /** ISO 4217 code (e.g. `EUR`). */
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, { message: "Invalid currency" }),
});

/**
 * Input for `getTourBookingQuote` server action.
 *
 * @see `TourBookingQuoteInput` — inferred output type
 */
export const tourBookingQuoteInputSchema = z.object({
  productId: tourBookingProductIdSchema,
  date: tourBookingIsoDateSchema,
  startTimeId: tourBookingStartTimeIdSchema,
  participants: tourBookingParticipantsSchema,
  /** Guided language code when slot exposes `guidedLanguages`. */
  language: z.string().trim().min(2).max(16).optional(),
  /** ISO currency for availabilities fetch; defaults to `EUR` in fetch layer. */
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, { message: "Invalid currency" })
    .optional(),
});

/**
 * Full submit payload for `submitTourBookingRequest`.
 *
 * Contact fields, slot selection, participants, and `clientQuote` for anti-tamper.
 * Omits legacy `tourDuration` and `preferredTime`.
 *
 * @see `TourBookingSubmitInput` — inferred output type
 */
export const tourBookingSubmitSchema = z.object({
  fullName: z.string().trim().min(3, {
    message: "Please enter your full name (at least 3 characters)",
  }),
  email: z.string().trim().email({
    message: "Please enter a valid email address",
  }),
  phoneNumber: tourBookingPhoneSchema,
  message: z
    .string()
    .trim()
    .min(10, {
      message:
        "Please provide more details about your tour preferences (at least 10 characters)",
    })
    .optional(),
  city: z.string().trim().min(1, { message: "Please select a city" }),
  productId: tourBookingProductIdSchema,
  productTitle: z.string().trim().min(1).optional(),
  date: tourBookingIsoDateSchema,
  startTimeId: tourBookingStartTimeIdSchema,
  language: z.string().trim().min(2).max(16).optional(),
  participants: tourBookingParticipantsSchema,
  clientQuote: tourBookingClientQuoteSchema,
  consent: z.boolean().refine((value) => value === true, {
    message: "You must agree to the terms to submit the form",
  }),
});

/** Parsed participant counters from `tourBookingParticipantsSchema`. */
export type TourBookingParticipants = z.infer<
  typeof tourBookingParticipantsSchema
>;

/** Validated input for `getTourBookingQuote`. */
export type TourBookingQuoteInput = z.infer<typeof tourBookingQuoteInputSchema>;

/** Validated payload for `submitTourBookingRequest`. */
export type TourBookingSubmitInput = z.infer<typeof tourBookingSubmitSchema>;

/** Client-reported total + currency on submit (shape validation only). */
export type TourBookingClientQuote = z.infer<
  typeof tourBookingClientQuoteSchema
>;

/**
 * Validates quote request input for server actions.
 *
 * @param input - Untrusted client/server-action payload
 * @returns Parsed `TourBookingQuoteInput` or the first Zod error message
 */
export function parseTourBookingQuoteInput(
  input: unknown,
):
  | { success: true; data: TourBookingQuoteInput }
  | { success: false; error: string } {
  const result = tourBookingQuoteInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid quote request",
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates booking submit input for server actions.
 *
 * @param input - Untrusted client/server-action payload
 * @returns Parsed `TourBookingSubmitInput` or the first Zod error message
 */
export function parseTourBookingSubmitInput(
  input: unknown,
):
  | { success: true; data: TourBookingSubmitInput }
  | { success: false; error: string } {
  const result = tourBookingSubmitSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid booking request",
    };
  }

  return { success: true, data: result.data };
}
