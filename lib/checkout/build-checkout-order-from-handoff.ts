/**
 * Builds checkout order summary display data from handoff + server quote (LOC-1154).
 */

import { format, parseISO } from "date-fns";

import { formatParticipantSummary } from "@/lib/booking/format-participant-summary";
import { formatBokunLanguage } from "@/lib/utils/format-bokun-language";
import type { CheckoutHandoffPayload } from "@/lib/checkout/handoff-token";
import type { CheckoutOrderFixture } from "@/components/checkout/checkout-mock-fixture";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Inputs required to render `CheckoutSummaryView` from verified handoff data. */
export interface BuildCheckoutOrderInput {
  payload: CheckoutHandoffPayload;
  /** Fresh server quote — totals must not come from `payload.clientQuote`. */
  quote: BookingWidgetQuote;
  productTitle: string;
  imageUrl: string;
  startTimeLabel: string;
}

/**
 * Formats an ISO `YYYY-MM-DD` date for the checkout order summary card.
 *
 * @param isoDate - Tour date from the handoff payload
 */
export function formatCheckoutDateLabel(isoDate: string): string {
  return format(parseISO(isoDate), "EEE, d MMM yyyy");
}

/**
 * Maps verified handoff + server quote into `CheckoutOrderFixture` for the summary UI.
 *
 * @param input - Handoff payload, server quote, and display metadata from tour detail
 */
export function buildCheckoutOrderFromHandoff(
  input: BuildCheckoutOrderInput,
): CheckoutOrderFixture {
  const { payload, quote, productTitle, imageUrl, startTimeLabel } = input;

  return {
    imageUrl,
    imageAlt: productTitle,
    title: productTitle,
    dateLabel: formatCheckoutDateLabel(payload.date),
    timeLabel: startTimeLabel,
    participantsLabel: formatParticipantSummary(payload.participants),
    languageLabel: payload.language ? formatBokunLanguage(payload.language) : undefined,
    totalAmount: quote.totalAmount,
    currency: quote.currency,
  };
}
