/**
 * Maps checkout summary UI state to `initiateCheckoutPayment` input (LOC-1162).
 *
 * Client-side helper used by `CheckoutSummaryView` before calling the Pay server
 * action. Trims contact fields and omits blank optional values.
 */

import type { CheckoutContactFieldsValues } from "@/components/checkout/CheckoutContactFields";
import type { InitiateCheckoutPaymentInput } from "@/lib/validation/checkout-payment";
import type { TourBookingClientQuote } from "@/lib/validation/tour-booking";

/** Inputs for `buildInitiateCheckoutPaymentInput`. */
export interface BuildInitiateCheckoutPaymentInputParams {
  /** Signed handoff token from `/checkout?h=…`. */
  handoffToken: string;
  /** Contact fields collected on the summary page. */
  contact: CheckoutContactFieldsValues;
  /** Must be true when Pay is clicked — enforced before building payload. */
  termsAccepted: boolean;
  /** Order total shown in the recap; anti-tamper checked server-side. */
  clientQuote: TourBookingClientQuote;
}

/**
 * Builds the server-action payment payload from summary-page state.
 *
 * @param params - Handoff token, contact, terms gate, and displayed total
 * @returns Parsed-ready `InitiateCheckoutPaymentInput` for `initiateCheckoutPayment`
 * @throws Error when terms are not accepted
 */
export function buildInitiateCheckoutPaymentInput({
  handoffToken,
  contact,
  termsAccepted,
  clientQuote,
}: BuildInitiateCheckoutPaymentInputParams): InitiateCheckoutPaymentInput {
  if (!termsAccepted) {
    throw new Error("Terms must be accepted");
  }

  const phone = contact.phone.trim();
  const comments = contact.comments.trim();

  return {
    handoffToken: handoffToken.trim(),
    contact: {
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      email: contact.email.trim(),
      ...(phone ? { phone } : {}),
      ...(comments ? { comments } : {}),
    },
    termsAccepted: true,
    clientQuote,
  };
}
