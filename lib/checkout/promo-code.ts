/**
 * Promo code validation pipeline (LOC-1230).
 *
 * This validates whether a `promoCode` changes the checkout price by:
 * 1) re-quoting the booking selection (undiscounted) from Bókun availabilities
 * 2) calling Bókun checkout options with `promoCode` included in the booking request
 * 3) comparing the checkout option amount vs the undiscounted server quote
 *
 * No inventory is reserved here (options-only); actual reserve/charge happens later.
 */

import { randomUUID } from "crypto";
import { z } from "zod";

import { computeTourBookingQuote } from "@/lib/booking/widget.actions";
import { getTourDetailById } from "@/lib/tours/detail.actions";
import { verifyCheckoutHandoffToken } from "@/lib/checkout/handoff-token";
import { handoffPayloadToQuoteInput } from "@/lib/checkout/handoff-payload-to-quote-input";
import { resolveMainContactRequirements } from "@/lib/bokun/resolve-main-contact-requirements";
import { validateCheckoutContactForProduct } from "@/lib/validation/validate-checkout-contact-for-product";
import {
  classifyCheckoutQuoteUnavailableReason,
  resolveCheckoutQuoteUnavailableMessage,
} from "@/lib/checkout/checkout-error-messages";

import {
  buildBokunBookingRequest,
  fetchBokunCheckoutOptions,
  findReserveCheckoutOption,
} from "@/lib/bokun/checkout";

import {
  checkoutPaymentContactSchema,
  type CheckoutPaymentContact,
} from "@/lib/validation/checkout-payment";

/**
 * Conservative validation for promo codes.
 *
 * We only allow "human" identifier characters and reject whitespace or
 * punctuation that could cause downstream parsing surprises.
 */
const SAFE_PROMO_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const validatePromoCodeInputSchema = z.object({
  handoffToken: z.string().trim().min(1),
  promoCode: z.string().trim().min(1).max(64).regex(SAFE_PROMO_CODE_REGEX, {
    message: "This code is invalid or has expired.",
  }),
  contact: checkoutPaymentContactSchema,
});

export type ValidatePromoCodeFailureError =
  | "invalid_handoff"
  | "quote_unavailable"
  | "tour_detail_unavailable"
  | "invalid_contact"
  | "unavailable"
  | "invalid_promo_code"
  | "invalid_response";

/** Result returned to the promo-code UI state machine. */
export type ValidatePromoCodeResult =
  | {
      success: true;
      data: {
        /** Whether Bókun actually applied a discount (amount changed). */
        valid: boolean;
        originalAmount: number;
        discountedAmount: number;
        discountAmount: number;
        currency: string;
      };
    }
  | { success: false; error: ValidatePromoCodeFailureError; message?: string };

export type ValidatePromoCodeInput = z.infer<
  typeof validatePromoCodeInputSchema
>;

function classifyQuoteFailureReason(
  message: string,
): ReturnType<typeof classifyCheckoutQuoteUnavailableReason> {
  return classifyCheckoutQuoteUnavailableReason(message, "quote");
}

function classifyTourDetailFailureReason(message: string) {
  return classifyCheckoutQuoteUnavailableReason(message, "tour_detail");
}

/**
 * Executes promo validation (pure, non-`"use server"`).
 *
 * @param input - Untrusted payload from `PromoCodeInput` client UI.
 */
export async function runValidatePromoCode(
  input: unknown,
): Promise<ValidatePromoCodeResult> {
  const parsed = validatePromoCodeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "invalid_promo_code",
      message: parsed.error.issues[0]?.message ?? "Invalid promo code request",
    };
  }

  const { handoffToken, promoCode, contact } = parsed.data;

  const verified = verifyCheckoutHandoffToken(handoffToken.trim());
  if (!verified.success) {
    return { success: false, error: "invalid_handoff" };
  }

  const payload = verified.payload;

  const quoteResult = await computeTourBookingQuote(
    handoffPayloadToQuoteInput(payload),
  );
  if (!quoteResult.success) {
    const reason = classifyQuoteFailureReason(quoteResult.error);
    return {
      success: false,
      error: "quote_unavailable",
      message: resolveCheckoutQuoteUnavailableMessage(reason),
    };
  }

  const tourDetail = await getTourDetailById(payload.productId);
  if (!tourDetail.success) {
    const reason = classifyTourDetailFailureReason(tourDetail.error);
    return {
      success: false,
      error: "tour_detail_unavailable",
      message: resolveCheckoutQuoteUnavailableMessage(reason),
    };
  }

  const defaultRateId = tourDetail.data.defaultRateId;
  if (defaultRateId == null) {
    return { success: false, error: "unavailable" };
  }

  const contactRequirements = resolveMainContactRequirements(tourDetail.data);
  const contactValidation = validateCheckoutContactForProduct(
    contact as CheckoutPaymentContact,
    contactRequirements,
  );
  if (!contactValidation.success) {
    return {
      success: false,
      error: "invalid_contact",
      message: contactValidation.error,
    };
  }

  const bookingRequest = buildBokunBookingRequest({
    productId: payload.productId,
    date: payload.date,
    startTimeId: payload.startTimeId,
    rateId: defaultRateId,
    quote: quoteResult.data,
    language: payload.language,
    contact,
    externalBookingReference: randomUUID(),
    promoCode,
  });

  const currency = quoteResult.data.currency ?? "EUR";
  const optionsResult = await fetchBokunCheckoutOptions(
    bookingRequest,
    currency,
  );
  if (!optionsResult.success) {
    return { success: false, error: "unavailable" };
  }

  const reserveOption = findReserveCheckoutOption(optionsResult.data.options);
  const discountedAmount = reserveOption?.amount;
  if (reserveOption?.currency && reserveOption.currency !== currency) {
    return { success: false, error: "invalid_response" };
  }

  if (typeof discountedAmount !== "number") {
    return { success: false, error: "invalid_response" };
  }

  const originalAmount = quoteResult.data.totalAmount;
  if (
    !Number.isFinite(discountedAmount) ||
    discountedAmount < 0 ||
    discountedAmount > originalAmount
  ) {
    return { success: false, error: "invalid_response" };
  }

  const discountAmount = originalAmount - discountedAmount;
  const valid = discountedAmount < originalAmount;

  return {
    success: true,
    data: {
      valid,
      originalAmount,
      discountedAmount,
      discountAmount,
      currency,
    },
  };
}
