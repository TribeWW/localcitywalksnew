/**
 * Bókun checkout options + reserve for external payment (LOC-1160 / PRD Task 3.2).
 *
 * Called on Pay click before Stripe session creation. Holds inventory via
 * `RESERVE_FOR_EXTERNAL_PAYMENT`; `confirmationCode` is stored on the pending
 * checkout KV row for webhook confirm (Phase 4).
 *
 * Flow mirrors `scripts/spike-bokun-checkout.mjs`:
 * 1. `POST /checkout.json/options/booking-request`
 * 2. `POST /checkout.json/submit` with `RESERVE_FOR_EXTERNAL_PAYMENT`
 */

import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
import { BOKUN_ENDPOINTS } from "@/lib/bokun/config";
import type {
  BookingWidgetQuote,
  BookingWidgetQuoteLineItem,
} from "@/types/bokun";

/** Default ISO currency for checkout options/submit query params. */
export const BOKUN_CHECKOUT_DEFAULT_CURRENCY = "EUR";

/** Bókun payment method for hold-until-Stripe-confirm flow. */
export const BOKUN_RESERVE_PAYMENT_METHOD = "RESERVE_FOR_EXTERNAL_PAYMENT";

/** Abort Bókun checkout requests after 5 seconds (aligned with availabilities). */
const REQUEST_TIMEOUT_MS = 5000;

/** One guest row in a Bókun activity booking (`passengers[]`). */
export interface BokunCheckoutPassenger {
  pricingCategoryId: number;
}

/** Single activity line inside a Bókun booking request. */
export interface BokunActivityBookingRequest {
  activityId: number;
  rateId: number;
  date: string;
  startTimeId: number;
  pickup: boolean;
  dropoff: boolean;
  passengers: BokunCheckoutPassenger[];
  extras: [];
  guidedLanguage?: string;
}

/** Main-contact answer row for Bókun checkout questions. */
export interface BokunMainContactDetail {
  questionId: string;
  values: string[];
}

/** Booking request body for checkout options and reserve submit. */
export interface BokunBookingRequest {
  externalBookingReference: string;
  mainContactDetails: BokunMainContactDetail[];
  activityBookings: BokunActivityBookingRequest[];
}

/** Payment methods block on a checkout option (spike response shape). */
export interface BokunCheckoutPaymentMethods {
  allowedMethods?: string[];
}

/** One payable checkout option returned by the options endpoint. */
export interface BokunCheckoutOption {
  type: string;
  amount?: number;
  currency?: string;
  paymentMethods?: BokunCheckoutPaymentMethods;
  /** Legacy/alternate field seen on some Bókun payloads. */
  allowedMethods?: string[];
}

/** Response from `POST /checkout.json/options/booking-request`. */
export interface BokunCheckoutOptionsResponse {
  options?: BokunCheckoutOption[];
}

/** Booking summary nested in checkout submit responses. */
export interface BokunCheckoutBookingSummary {
  confirmationCode?: string;
  id?: number;
}

/** Response from `POST /checkout.json/submit`. */
export interface BokunCheckoutSubmitResponse {
  booking?: BokunCheckoutBookingSummary;
}

/** Submit body for reserve-for-external-payment checkout. */
export interface BokunReserveSubmitRequest {
  checkoutOption: string;
  paymentMethod: typeof BOKUN_RESERVE_PAYMENT_METHOD;
  source: "DIRECT_REQUEST";
  directBooking: BokunBookingRequest;
  sendNotificationToMainContact: boolean;
  externalBookingReference: string;
}

/** Contact fields required to reserve a checkout booking. */
export interface BokunCheckoutContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

/** Inputs for `reserveBokunCheckout` on Pay click. */
export interface ReserveBokunCheckoutInput {
  productId: string;
  date: string;
  startTimeId: number;
  rateId: number;
  quote: BookingWidgetQuote;
  language?: string;
  contact: BokunCheckoutContact;
  /** Internal checkout id — used as Bókun `externalBookingReference`. */
  externalBookingReference: string;
}

export type ReserveBokunCheckoutResult =
  | {
      success: true;
      data: {
        confirmationCode: string;
        checkoutAmount: number;
        currency: string;
        externalBookingReference: string;
      };
    }
  | {
      success: false;
      error:
        | "options_failed"
        | "reserve_unavailable"
        | "reserve_failed"
        | "invalid_response";
    };

/**
 * Expands quote breakdown lines into one Bókun passenger per guest.
 *
 * @param breakdown - Server-verified quote lines with Bókun `categoryId` + count
 */
export function buildCheckoutPassengersFromQuote(
  breakdown: readonly BookingWidgetQuoteLineItem[],
): BokunCheckoutPassenger[] {
  const passengers: BokunCheckoutPassenger[] = [];

  for (const line of breakdown) {
    for (let index = 0; index < line.count; index += 1) {
      passengers.push({ pricingCategoryId: line.categoryId });
    }
  }

  return passengers;
}

/**
 * Maps checkout summary contact fields to Bókun `mainContactDetails` questions.
 *
 * @param contact - Name, email, and optional phone from checkout summary
 */
export function buildMainContactDetails(
  contact: BokunCheckoutContact,
): BokunMainContactDetail[] {
  const details: BokunMainContactDetail[] = [
    { questionId: "firstName", values: [contact.firstName.trim()] },
    { questionId: "lastName", values: [contact.lastName.trim()] },
    { questionId: "email", values: [contact.email.trim()] },
  ];

  const phone = contact.phone?.trim();
  if (phone) {
    details.push({ questionId: "phoneNumber", values: [phone] });
  }

  return details;
}

/**
 * Builds the Bókun `booking-request` payload from Pay-click checkout state.
 *
 * @param input - Slot selection, quote breakdown, contact, and external reference
 */
export function buildBokunBookingRequest(
  input: ReserveBokunCheckoutInput,
): BokunBookingRequest {
  const activityBooking: BokunActivityBookingRequest = {
    activityId: (() => {
      const id = Number(input.productId);
      if (!Number.isInteger(id)) {
        throw new Error(`Invalid productId: ${input.productId}`);
      }
      return id;
    })(),
    rateId: input.rateId,
    date: input.date,
    startTimeId: input.startTimeId,
    pickup: false,
    dropoff: false,
    passengers: buildCheckoutPassengersFromQuote(input.quote.breakdown),
    extras: [],
  };

  const guidedLanguage = input.language?.trim();
  if (guidedLanguage) {
    activityBooking.guidedLanguage = guidedLanguage;
  }

  return {
    externalBookingReference: input.externalBookingReference,
    mainContactDetails: buildMainContactDetails(input.contact),
    activityBookings: [activityBooking],
  };
}

/**
 * Returns allowed payment methods for a checkout option (handles Bókun shape variants).
 */
export function getCheckoutOptionAllowedMethods(
  option: BokunCheckoutOption,
): string[] {
  return option.paymentMethods?.allowedMethods ?? option.allowedMethods ?? [];
}

/**
 * Selects the first checkout option that supports external reserve payment.
 *
 * @param options - `options` array from checkout options response
 */
export function findReserveCheckoutOption(
  options: readonly BokunCheckoutOption[] | undefined,
): BokunCheckoutOption | null {
  if (!options?.length) {
    return null;
  }

  return (
    options.find((option) =>
      getCheckoutOptionAllowedMethods(option).includes(
        BOKUN_RESERVE_PAYMENT_METHOD,
      ),
    ) ?? null
  );
}

/**
 * Builds the reserve submit body for `POST /checkout.json/submit`.
 *
 * @param checkoutOption - Option `type` from checkout options response
 * @param bookingRequest - Populated booking request with contact answers
 */
export function buildReserveSubmitBody(
  checkoutOption: string,
  bookingRequest: BokunBookingRequest,
): BokunReserveSubmitRequest {
  return {
    checkoutOption,
    paymentMethod: BOKUN_RESERVE_PAYMENT_METHOD,
    source: "DIRECT_REQUEST",
    directBooking: bookingRequest,
    sendNotificationToMainContact: false,
    externalBookingReference: bookingRequest.externalBookingReference,
  };
}

/**
 * Reads `booking.confirmationCode` from a reserve submit response.
 */
export function extractBokunConfirmationCode(
  response: BokunCheckoutSubmitResponse,
): string | null {
  const code = response.booking?.confirmationCode?.trim();
  return code || null;
}

/**
 * Appends `currency` query param to a signed checkout API path.
 */
export function buildCheckoutPathWithCurrency(
  path: string,
  currency: string,
): string {
  const searchParams = new URLSearchParams({ currency });
  return `${path}?${searchParams.toString()}`;
}

/**
 * POSTs a booking request to Bókun checkout options.
 *
 * @param bookingRequest - Slot + passengers + contact answers
 * @param currency - ISO currency query param; defaults to EUR
 */
export async function fetchBokunCheckoutOptions(
  bookingRequest: BokunBookingRequest,
  currency: string = BOKUN_CHECKOUT_DEFAULT_CURRENCY,
): Promise<
  { success: true; data: BokunCheckoutOptionsResponse } | { success: false }
> {
  const path = buildCheckoutPathWithCurrency(
    BOKUN_ENDPOINTS.CHECKOUT_OPTIONS,
    currency,
  );
  const url = createBokunUrl(path);
  const headers = generateBokunHeaders("POST", path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bookingRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[bokun-checkout] options failed (${response.status}) for ref ${bookingRequest.externalBookingReference}`,
      );
      return { success: false };
    }

    const data = (await response.json()) as BokunCheckoutOptionsResponse;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[bokun-checkout] options error for ref ${bookingRequest.externalBookingReference}: ${message}`,
    );
    return { success: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * POSTs a reserve-for-external-payment checkout submit.
 *
 * @param submitBody - Reserve submit payload from `buildReserveSubmitBody`
 * @param currency - ISO currency query param; defaults to EUR
 */
export async function submitBokunCheckoutReserve(
  submitBody: BokunReserveSubmitRequest,
  currency: string = BOKUN_CHECKOUT_DEFAULT_CURRENCY,
): Promise<
  { success: true; data: BokunCheckoutSubmitResponse } | { success: false }
> {
  const path = buildCheckoutPathWithCurrency(
    BOKUN_ENDPOINTS.CHECKOUT_SUBMIT,
    currency,
  );
  const url = createBokunUrl(path);
  const headers = generateBokunHeaders("POST", path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(submitBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[bokun-checkout] reserve submit failed (${response.status}) for ref ${submitBody.externalBookingReference}`,
      );
      return { success: false };
    }

    const data = (await response.json()) as BokunCheckoutSubmitResponse;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[bokun-checkout] reserve submit error for ref ${submitBody.externalBookingReference}: ${message}`,
    );
    return { success: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verifies a Bókun checkout option amount/currency match the server-verified quote.
 *
 * @param option - Reserve checkout option from options response
 * @param quote - Server-verified quote from checkout summary re-quote
 */
export function checkoutOptionMatchesQuote(
  option: Pick<BokunCheckoutOption, "amount" | "currency">,
  quote: BookingWidgetQuote,
): boolean {
  if (option.amount !== quote.totalAmount) {
    return false;
  }

  const expectedCurrency = quote.currency || BOKUN_CHECKOUT_DEFAULT_CURRENCY;
  if (option.currency && option.currency !== expectedCurrency) {
    return false;
  }

  return true;
}

/**
 * Reserves a Bókun booking for external Stripe payment (Pay click).
 *
 * Calls checkout options, verifies `RESERVE_FOR_EXTERNAL_PAYMENT` is offered,
 * then submits the reserve. Returns `confirmationCode` for KV + webhook flow.
 *
 * @param input - Verified slot, quote, contact, and internal checkout reference
 */
export async function reserveBokunCheckout(
  input: ReserveBokunCheckoutInput,
): Promise<ReserveBokunCheckoutResult> {
  const currency = input.quote.currency || BOKUN_CHECKOUT_DEFAULT_CURRENCY;
  const bookingRequest = buildBokunBookingRequest(input);

  const optionsResult = await fetchBokunCheckoutOptions(
    bookingRequest,
    currency,
  );
  if (!optionsResult.success) {
    return { success: false, error: "options_failed" };
  }

  const reserveOption = findReserveCheckoutOption(optionsResult.data.options);
  if (!reserveOption?.type) {
    return { success: false, error: "reserve_unavailable" };
  }

  const checkoutAmount = reserveOption.amount;
  if (typeof checkoutAmount !== "number") {
    console.error(
      `[bokun-checkout] reserve option missing amount for ref ${input.externalBookingReference}`,
    );
    return { success: false, error: "invalid_response" };
  }

  if (!checkoutOptionMatchesQuote(reserveOption, input.quote)) {
    console.error(
      `[bokun-checkout] reserve option amount/currency mismatch for ref ${input.externalBookingReference}`,
    );
    return { success: false, error: "invalid_response" };
  }

  const submitBody = buildReserveSubmitBody(reserveOption.type, bookingRequest);
  const submitResult = await submitBokunCheckoutReserve(submitBody, currency);
  if (!submitResult.success) {
    return { success: false, error: "reserve_failed" };
  }

  const confirmationCode = extractBokunConfirmationCode(submitResult.data);
  if (!confirmationCode) {
    return { success: false, error: "invalid_response" };
  }

  return {
    success: true,
    data: {
      confirmationCode,
      checkoutAmount,
      currency: reserveOption.currency ?? currency,
      externalBookingReference: input.externalBookingReference,
    },
  };
}
