/**
 * Checkout price-update detection after server re-quote (LOC-1156).
 *
 * Compares handoff `clientQuote` snapshot to the fresh server quote on summary load.
 */

import { clientQuoteMatchesServer } from "@/lib/actions/booking-widget-submit";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import type { TourBookingClientQuote } from "@/lib/validation/tour-booking";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Previous vs current totals when checkout re-quote differs from the handoff snapshot. */
export interface CheckoutPriceUpdate {
  previousTotalAmount: number;
  previousCurrency: string;
  currentTotalAmount: number;
  currentCurrency: string;
}

/**
 * Detects whether the server re-quote changed since the widget handoff.
 *
 * @param clientQuote - Untrusted snapshot embedded in the signed handoff token
 * @param serverQuote - Fresh quote from `computeTourBookingQuote` on summary load
 */
export function detectCheckoutPriceUpdate(
  clientQuote: TourBookingClientQuote,
  serverQuote: BookingWidgetQuote,
): CheckoutPriceUpdate | null {
  if (clientQuoteMatchesServer(clientQuote, serverQuote)) {
    return null;
  }

  return {
    previousTotalAmount: clientQuote.totalAmount,
    previousCurrency: clientQuote.currency,
    currentTotalAmount: serverQuote.totalAmount,
    currentCurrency: serverQuote.currency,
  };
}

/**
 * Customer-facing banner copy for an updated checkout total.
 *
 * @param priceUpdate - Detected mismatch between handoff and server quote
 */
export function resolveCheckoutPriceUpdatedBannerMessage(
  priceUpdate: CheckoutPriceUpdate,
): string {
  const previousLabel = formatCataloguePriceAmount(
    priceUpdate.previousTotalAmount,
    priceUpdate.previousCurrency,
  );
  const currentLabel = formatCataloguePriceAmount(
    priceUpdate.currentTotalAmount,
    priceUpdate.currentCurrency,
  );

  if (previousLabel && currentLabel) {
    return `The total price has changed from ${previousLabel} to ${currentLabel}. Please review the updated total before paying.`;
  }

  return "The total price has been updated since you left the tour page. Please review the new total before paying.";
}
