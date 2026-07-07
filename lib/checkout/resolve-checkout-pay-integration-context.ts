/**
 * Resolves a live bookable slot + handoff + Pay payload for integration tests (LOC-1164).
 *
 * Imports Bókun/quote modules — use only from opt-in integration tests or scripts.
 */

import { computeTourBookingQuote } from "@/lib/actions/booking-widget.actions";
import { fetchAvailabilities } from "@/lib/bokun/fetch-availabilities";
import { buildInitiateCheckoutPaymentInput } from "@/lib/checkout/build-initiate-checkout-payment-input";
import {
  buildCheckoutPayIntegrationAvailabilityRange,
  CHECKOUT_PAY_INTEGRATION_CONTACT,
  CHECKOUT_PAY_INTEGRATION_PARTICIPANTS,
  CHECKOUT_PAY_INTEGRATION_PRODUCT_ID,
  extractHandoffTokenFromCheckoutRedirectUrl,
  pickFirstBookableAvailabilitySlot,
  toAvailabilityIsoDate,
} from "@/lib/checkout/checkout-pay-integration-fixture";
import {
  executeStartCheckoutHandoff,
  type StartCheckoutHandoffInput,
} from "@/lib/checkout/start-checkout-handoff";
import type { InitiateCheckoutPaymentInput } from "@/lib/validation/checkout-payment";

export type CheckoutPayIntegrationContext = {
  handoffToken: string;
  paymentInput: InitiateCheckoutPaymentInput;
  slot: {
    productId: string;
    date: string;
    startTimeId: number;
    language?: string;
  };
};

/**
 * Resolves a live bookable slot, mints handoff token, and builds Pay input.
 *
 * @throws Error when no slot, quote, or handoff is available
 */
export async function resolveCheckoutPayIntegrationContext(): Promise<CheckoutPayIntegrationContext> {
  const productId = CHECKOUT_PAY_INTEGRATION_PRODUCT_ID;
  const range = buildCheckoutPayIntegrationAvailabilityRange();
  const availabilities = await fetchAvailabilities(productId, {
    start: range.start,
    end: range.end,
    currency: "EUR",
    includeSoldOut: false,
  });

  if (!availabilities.success) {
    throw new Error(
      `Integration availabilities failed: ${availabilities.error}`,
    );
  }

  const slot = pickFirstBookableAvailabilitySlot(availabilities.data);
  if (!slot) {
    throw new Error(
      `No bookable slot for product ${productId} between ${range.start} and ${range.end}`,
    );
  }

  const date = toAvailabilityIsoDate(slot.date);
  const language = slot.guidedLanguages[0];
  const quoteResult = await computeTourBookingQuote({
    productId,
    date,
    startTimeId: slot.startTimeId,
    participants: CHECKOUT_PAY_INTEGRATION_PARTICIPANTS,
    currency: "EUR",
    language,
  });

  if (!quoteResult.success) {
    throw new Error(`Integration quote failed: ${quoteResult.error}`);
  }

  const handoffInput: StartCheckoutHandoffInput = {
    productId,
    date,
    startTimeId: slot.startTimeId,
    participants: CHECKOUT_PAY_INTEGRATION_PARTICIPANTS,
    language,
    clientQuote: {
      totalAmount: quoteResult.data.totalAmount,
      currency: quoteResult.data.currency,
    },
    productTitle: "Checkout integration test",
  };

  const handoffResult = await executeStartCheckoutHandoff(handoffInput);
  if (!handoffResult.success) {
    throw new Error(`Integration handoff failed: ${handoffResult.error}`);
  }

  const handoffToken = extractHandoffTokenFromCheckoutRedirectUrl(
    handoffResult.redirectUrl,
  );
  if (!handoffToken) {
    throw new Error("Integration handoff returned an invalid redirect URL");
  }

  const paymentInput = buildInitiateCheckoutPaymentInput({
    handoffToken,
    contact: CHECKOUT_PAY_INTEGRATION_CONTACT,
    termsAccepted: true,
    clientQuote: handoffInput.clientQuote,
  });

  return {
    handoffToken,
    paymentInput,
    slot: {
      productId,
      date,
      startTimeId: slot.startTimeId,
      language,
    },
  };
}
