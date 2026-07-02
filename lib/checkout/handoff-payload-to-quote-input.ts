/**
 * Maps a verified handoff payload to quote pipeline input (LOC-1154).
 */

import type { CheckoutHandoffPayload } from "@/lib/checkout/handoff-token";
import type { TourBookingQuoteInput } from "@/lib/validation/tour-booking";

/**
 * Converts signed handoff payload fields into `computeTourBookingQuote` input.
 *
 * @param payload - Verified token payload from `verifyCheckoutHandoffToken`
 */
export function handoffPayloadToQuoteInput(
  payload: CheckoutHandoffPayload,
): TourBookingQuoteInput {
  return {
    productId: payload.productId,
    date: payload.date,
    startTimeId: payload.startTimeId,
    participants: payload.participants,
    language: payload.language,
    currency: payload.clientQuote.currency,
  };
}
