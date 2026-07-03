/**
 * User-facing checkout error copy and classification (LOC-1155).
 *
 * Maps pipeline failures to sold-out policy messaging and handoff error titles.
 */

import type { VerifyCheckoutHandoffError } from "@/lib/checkout/handoff-token";

/** Why a handoff token could not be used on `/checkout`. */
export type CheckoutHandoffErrorReason = "missing" | VerifyCheckoutHandoffError;

/** Quote pipeline error when the Bókun slot is missing or sold out. */
export const CHECKOUT_SOLD_OUT_QUOTE_ERROR =
  "Unable to calculate quote for this selection";

/** Why checkout could not load a server-verified quote after a valid handoff. */
export type CheckoutQuoteUnavailableReason =
  | "sold_out"
  | "tour_detail_unavailable"
  | "quote_error";

/**
 * Classifies a quote/detail failure for checkout error UI.
 *
 * @param message - Raw error from `getTourDetailById` or `computeTourBookingQuote`
 * @param context - Whether the failure happened before or during re-quote
 */
export function classifyCheckoutQuoteUnavailableReason(
  message: string,
  context: "tour_detail" | "quote",
): CheckoutQuoteUnavailableReason {
  if (context === "tour_detail") {
    return "tour_detail_unavailable";
  }

  if (message === CHECKOUT_SOLD_OUT_QUOTE_ERROR) {
    return "sold_out";
  }

  return "quote_error";
}

/**
 * Resolves customer-facing copy for sold-out and quote failures.
 *
 * @param reason - Classified unavailable reason from `classifyCheckoutQuoteUnavailableReason`
 */
export function resolveCheckoutQuoteUnavailableMessage(
  reason: CheckoutQuoteUnavailableReason,
): string {
  if (reason === "sold_out") {
    return "This time slot is no longer available. Please choose another date or time on the tour page.";
  }

  if (reason === "tour_detail_unavailable") {
    return "We couldn't load this tour's details. Please try again from the tour page.";
  }

  return "We couldn't confirm availability for this booking. Please return to the tour page and try again.";
}

/**
 * Resolves the page heading for invalid handoff errors.
 *
 * @param reason - Handoff failure reason from token verification
 */
export function resolveCheckoutHandoffErrorTitle(
  reason: CheckoutHandoffErrorReason,
): string {
  if (reason === "expired") {
    return "Checkout link expired";
  }

  if (
    reason === "missing" ||
    reason === "malformed" ||
    reason === "invalid_signature" ||
    reason === "invalid_payload"
  ) {
    return "Checkout link invalid";
  }

  return "Checkout unavailable";
}

/**
 * Resolves the page heading for sold-out / quote failures.
 *
 * @param reason - Classified quote unavailable reason
 */
export function resolveCheckoutQuoteUnavailableTitle(
  reason: CheckoutQuoteUnavailableReason,
): string {
  if (reason === "sold_out") {
    return "Time slot unavailable";
  }

  return "Checkout unavailable";
}
