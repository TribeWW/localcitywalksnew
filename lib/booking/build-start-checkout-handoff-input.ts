/**
 * Maps booking widget step-1 state to `startCheckoutHandoff` input (LOC-1157).
 *
 * Client-side helper used by `BookingWidget` before calling `startCheckoutHandoff`.
 * Contact fields are collected on the checkout summary page — not included here.
 */

import { format } from "date-fns";
import type { StartCheckoutHandoffInput } from "@/lib/checkout/start-checkout-handoff";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Step-1 widget form slice required for checkout handoff. */
export interface BookingWidgetHandoffFormValues {
  preferredDate?: Date;
  startTimeId?: string;
  language?: string;
  adults: number;
  youth: number;
  children: number;
  infants: number;
}

/** Inputs for `buildStartCheckoutHandoffInput`. */
export interface BuildStartCheckoutHandoffInputParams {
  /** Current step-1 form values from `BookingWidget`. */
  values: BookingWidgetHandoffFormValues;
  /** Bókun activity id from bootstrap. */
  productId: string;
  /** Product title from bootstrap for checkout recap / token payload. */
  productTitle: string;
  /** Live quote shown in the widget; attached as `clientQuote` for anti-tamper. */
  quote: BookingWidgetQuote;
}

/**
 * Builds the server-action handoff payload from widget step-1 state and live quote.
 *
 * @param params - Step-1 selection, product metadata, and debounced quote
 * @returns Parsed-ready `StartCheckoutHandoffInput` for `startCheckoutHandoff`
 * @throws Error when `preferredDate` or `startTimeId` are missing
 */
export function buildStartCheckoutHandoffInput({
  values,
  productId,
  productTitle,
  quote,
}: BuildStartCheckoutHandoffInputParams): StartCheckoutHandoffInput {
  if (!values.preferredDate) {
    throw new Error("Missing tour date");
  }

  const startTimeId = values.startTimeId
    ? Number(values.startTimeId)
    : Number.NaN;

  if (!Number.isFinite(startTimeId) || startTimeId <= 0) {
    throw new Error("Missing start time");
  }

  return {
    productId: productId.trim(),
    productTitle: productTitle.trim() || undefined,
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
  };
}
