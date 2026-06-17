/**
 * Booking widget server actions (LOC-1047 / LOC-1056).
 *
 * Server-only entry points for the tour-page booking widget (`BookingWidget`,
 * LOC-1048). Wraps:
 *
 * - `getTourAvailabilities` — calendar / slot data
 * - `getTourBookingQuote` / `computeTourBookingQuote` — live pricing (LOC-1040)
 * - `submitTourBookingRequest` — re-quote, anti-tamper, emails (LOC-1056)
 *
 * All Bókun credentials stay server-side. Responses use discriminated unions
 * (`{ success, data?, error? }`). Submit emails use LOC-1055 (`sendBookingWidgetRequestEmails`).
 */

"use server";

import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import {
  BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
  clientQuoteMatchesServer,
  resolveStartTimeLabel,
  submitInputToQuoteInput,
} from "@/lib/actions/booking-widget-submit";
import { buildBookingWidgetEmailContent } from "@/lib/nodemailer/build-booking-widget-email-content";
import { sendBookingWidgetRequestEmails } from "@/lib/nodemailer";
import { calculateBookingQuote } from "@/lib/bokun/calculate-booking-quote";
import { fetchAvailabilities } from "@/lib/bokun/fetch-availabilities";
import {
  parseTourBookingQuoteInput,
  parseTourBookingSubmitInput,
  SAFE_BOKUN_PRODUCT_ID_REGEX,
  TOUR_BOOKING_ISO_DATE_REGEX,
  type TourBookingQuoteInput,
  type TourBookingSubmitInput,
} from "@/lib/validation/tour-booking";
import type {
  GetTourAvailabilitiesResult,
  GetTourBookingQuoteResult,
  SubmitTourBookingRequestResult,
} from "@/types/bokun";

/** Default ISO currency for availabilities fetch and quote (LOC-1041). */
const DEFAULT_CURRENCY = "EUR";

/**
 * Validates a trimmed Bókun product id against `SAFE_BOKUN_PRODUCT_ID_REGEX`.
 * Aligned with `SAFE_ID_REGEX` in `tour-detail.actions.ts`.
 */
function isValidProductId(productId: string): boolean {
  const trimmed = productId.trim();
  return trimmed.length > 0 && SAFE_BOKUN_PRODUCT_ID_REGEX.test(trimmed);
}

/**
 * Validates `YYYY-MM-DD` date strings for availabilities range params.
 * Does not enforce future-date rules (calendar may request past months for UI).
 */
function isValidIsoDate(date: string): boolean {
  return TOUR_BOOKING_ISO_DATE_REGEX.test(date.trim());
}

/**
 * Fetches Bókun availability slots for a product and inclusive date range.
 *
 * Used by the widget date picker / calendar to disable sold-out days and list
 * start times. Delegates to `fetchAvailabilities` (15-min cache, 5s timeout).
 *
 * @param productId - Bókun activity id (e.g. `"1079932"`)
 * @param start - Inclusive range start `YYYY-MM-DD`
 * @param end - Inclusive range end `YYYY-MM-DD`
 * @param currency - ISO 4217 code; defaults to `EUR`
 * @returns `BokunAvailability[]` on success, or a safe error message
 */
export async function getTourAvailabilities(
  productId: string,
  start: string,
  end: string,
  currency: string = DEFAULT_CURRENCY,
): Promise<GetTourAvailabilitiesResult> {
  if (!isValidProductId(productId)) {
    return { success: false, error: "Invalid product id" };
  }

  const trimmedStart = start.trim();
  const trimmedEnd = end.trim();

  if (!isValidIsoDate(trimmedStart) || !isValidIsoDate(trimmedEnd)) {
    return { success: false, error: "Invalid date range" };
  }

  if (trimmedStart > trimmedEnd) {
    return { success: false, error: "Invalid date range" };
  }

  const result = await fetchAvailabilities(productId.trim(), {
    start: trimmedStart,
    end: trimmedEnd,
    currency: currency.trim() || DEFAULT_CURRENCY,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "Unable to load availabilities",
    };
  }

  return { success: true, data: result.data };
}

/**
 * Computes a live booking quote for the selected slot and participants.
 *
 * Validates untrusted client input, then runs `computeTourBookingQuote`.
 * Called on debounced participant / date / time changes from `BookingWidget`.
 *
 * @param input - Untrusted payload; validated via `parseTourBookingQuoteInput`
 * @returns `BookingWidgetQuote` on success, or the first validation / pipeline error
 */
export async function getTourBookingQuote(
  input: unknown,
): Promise<GetTourBookingQuoteResult> {
  const parsed = parseTourBookingQuoteInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return computeTourBookingQuote(parsed.data);
}

/**
 * Core quote pipeline — loads product context, fetches slot pricing, calculates total.
 *
 * Steps:
 * 1. `getTourDetailById` → `defaultRateId`, `pricingCategories`
 * 2. `fetchAvailabilities` for a **single-day** window (`start = end = date`)
 * 3. `calculateBookingQuote` with per-category band lookup
 *
 * Exported for unit tests (avoids `"use server"` boundary in Vitest).
 *
 * @param input - Pre-validated `TourBookingQuoteInput`
 * @returns `BookingWidgetQuote` or a safe error when detail, fetch, or pricing fails
 */
export async function computeTourBookingQuote(
  input: TourBookingQuoteInput,
): Promise<GetTourBookingQuoteResult> {
  const { productId, date, startTimeId, participants } = input;
  const currency = input.currency ?? DEFAULT_CURRENCY;

  const detail = await getTourDetailById(productId);
  if (!detail.success) {
    return {
      success: false,
      error: detail.error,
    };
  }

  const defaultRateId = detail.data.defaultRateId;
  if (defaultRateId == null) {
    console.error(
      `[booking-widget] missing defaultRateId for product ${productId}`,
    );
    return { success: false, error: "Unable to calculate quote" };
  }

  const availabilities = await fetchAvailabilities(productId, {
    start: date,
    end: date,
    currency,
  });

  if (!availabilities.success) {
    return {
      success: false,
      error: availabilities.error ?? "Unable to load availabilities",
    };
  }

  const quote = calculateBookingQuote(
    availabilities.data,
    date,
    startTimeId,
    participants,
    defaultRateId,
    { pricingCategories: detail.data.pricingCategories },
  );

  if (!quote) {
    return {
      success: false,
      error: "Unable to calculate quote for this selection",
    };
  }

  return { success: true, data: quote };
}

/** User-facing error when SMTP delivery fails during submit. */
const SUBMIT_EMAIL_FAILURE_ERROR =
  "Failed to send tour request. Please try again later.";

/**
 * Core submit pipeline — re-quote, anti-tamper check, then team + customer emails.
 *
 * Steps:
 * 1. `computeTourBookingQuote` with submit slot + participants
 * 2. Compare `clientQuote` to server quote (`clientQuoteMatchesServer`)
 * 3. `getTourDetailById` for `startTimeLabel`, title fallback, `durationText`
 * 4. `buildBookingWidgetEmailContent` + `sendBookingWidgetRequestEmails`
 *
 * Exported for unit tests (avoids `"use server"` boundary in Vitest).
 *
 * @param submit - Pre-validated `TourBookingSubmitInput`
 * @returns `{ success: true }` or `{ success: false, error }` with safe user copy
 */
export async function executeSubmitTourBookingRequest(
  submit: TourBookingSubmitInput,
): Promise<SubmitTourBookingRequestResult> {
  const quoteResult = await computeTourBookingQuote(
    submitInputToQuoteInput(submit),
  );

  if (!quoteResult.success) {
    return { success: false, error: quoteResult.error };
  }

  if (!clientQuoteMatchesServer(submit.clientQuote, quoteResult.data)) {
    return { success: false, error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR };
  }

  const detail = await getTourDetailById(submit.productId);
  if (!detail.success) {
    return { success: false, error: detail.error };
  }

  const productTitle =
    detail.data.title.trim() || submit.productTitle?.trim() || "Tour";
  const startTimeLabel = resolveStartTimeLabel(
    detail.data.startTimes,
    submit.startTimeId,
  );

  const emailContent = buildBookingWidgetEmailContent({
    submit,
    quote: quoteResult.data,
    startTimeLabel,
    productTitle,
    durationText: detail.data.durationText,
  });

  try {
    await sendBookingWidgetRequestEmails(emailContent);
  } catch (error) {
    console.error("[booking-widget] submit email delivery failed:", error);
    return { success: false, error: SUBMIT_EMAIL_FAILURE_ERROR };
  }

  return { success: true };
}

/**
 * Validates, re-quotes, and submits a booking-widget tour request (LOC-1056).
 *
 * Rejects tampered `clientQuote` totals, then sends team + customer emails
 * with server-verified pricing via LOC-1055.
 *
 * @param input - Untrusted client payload; validated via `parseTourBookingSubmitInput`
 * @returns `{ success: true }` on email delivery, or `{ success: false, error }`
 */
export async function submitTourBookingRequest(
  input: unknown,
): Promise<SubmitTourBookingRequestResult> {
  const parsed = parseTourBookingSubmitInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return executeSubmitTourBookingRequest(parsed.data);
}
