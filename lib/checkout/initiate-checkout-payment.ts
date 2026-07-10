/**
 * Checkout Pay-click pipeline (LOC-1161 / PRD Task 3.3).
 *
 * Validates contact + terms, verifies handoff token, re-quotes, Bókun reserve,
 * KV pending row, and Stripe hosted Checkout Session redirect. Imported by the
 * `initiateCheckoutPayment` server action — no `"use server"` here.
 */

import { randomUUID } from "crypto";

import { computeTourBookingQuote } from "@/lib/actions/booking-widget.actions";
import {
  BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
  clientQuoteMatchesServer,
} from "@/lib/actions/booking-widget-submit";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { reserveBokunCheckout, abortReservedBokunCheckout } from "@/lib/bokun/checkout";
import {
  CHECKOUT_SOLD_OUT_QUOTE_ERROR,
  resolveCheckoutQuoteUnavailableMessage,
} from "@/lib/checkout/checkout-error-messages";
import { handoffPayloadToQuoteInput } from "@/lib/checkout/handoff-payload-to-quote-input";
import {
  hashCheckoutHandoffTokenForPendingCheckout,
  verifyCheckoutHandoffToken,
} from "@/lib/checkout/handoff-token";
import {
  createPendingCheckout,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";
import { resolveMainContactRequirements } from "@/lib/bokun/resolve-main-contact-requirements";
import { createStripeCheckoutSession } from "@/lib/stripe/create-checkout-session";
import {
  parseInitiateCheckoutPaymentInput,
  type InitiateCheckoutPaymentInput,
} from "@/lib/validation/checkout-payment";
import { validateCheckoutContactForProduct } from "@/lib/validation/validate-checkout-contact-for-product";
import type { InitiateCheckoutPaymentResult } from "@/types/bokun";

/** User-facing error when payment infrastructure is misconfigured. */
export const CHECKOUT_PAYMENT_UNAVAILABLE_ERROR =
  "Payment is not available right now. Please try again later.";

/** User-facing error when the handoff token cannot be used. */
export const CHECKOUT_HANDOFF_INVALID_ERROR =
  "This checkout link isn't valid. Please return to the tour page and try again.";

/** User-facing error when the handoff token expired. */
export const CHECKOUT_HANDOFF_EXPIRED_ERROR =
  "This checkout link has expired. Please return to the tour page and start again.";

/**
 * Maps Bókun reserve failures to customer-facing copy.
 *
 * @param error - Reserve error code from `reserveBokunCheckout`
 */
export function resolveBokunReserveFailureMessage(
  error:
    | "options_failed"
    | "reserve_unavailable"
    | "reserve_failed"
    | "invalid_response",
): string {
  if (error === "reserve_failed") {
    return resolveCheckoutQuoteUnavailableMessage("sold_out");
  }

  return CHECKOUT_PAYMENT_UNAVAILABLE_ERROR;
}

/**
 * Builds pending-checkout contact with server-recorded terms acceptance time.
 *
 * @param contact - Validated summary-page contact fields
 * @param termsAcceptedAt - ISO timestamp when Pay was clicked
 */
export function buildPendingCheckoutContact(
  contact: InitiateCheckoutPaymentInput["contact"],
  termsAcceptedAt: string,
) {
  const phone = contact.phone?.trim();

  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    ...(phone ? { phone } : {}),
    ...(contact.comments?.trim()
      ? { comments: contact.comments.trim() }
      : {}),
    termsAcceptedAt,
  };
}

/**
 * Releases a Bókun hold when post-reserve Pay infrastructure fails.
 *
 * Logs when abort fails so ops can reconcile orphaned reservations.
 *
 * @param confirmationCode - Bókun confirmation code from successful reserve
 * @param checkoutId - Internal checkout id for log correlation
 * @param stage - Failed pipeline stage (for logging)
 */
export async function releaseBokunReservationAfterPaymentFailure(
  confirmationCode: string,
  checkoutId: string,
  stage: string,
): Promise<void> {
  const aborted = await abortReservedBokunCheckout(confirmationCode);
  if (!aborted.success) {
    console.error(
      `[checkout-payment] failed to abort Bókun reservation ${confirmationCode} after ${stage} (checkout ${checkoutId})`,
    );
  }
}

/**
 * Options for the Pay-click pipeline when invoked from a server action.
 */
export interface ExecuteInitiateCheckoutPaymentOptions {
  /** Resolved public origin for Stripe success/cancel redirects. */
  checkoutOrigin?: string;
}

/**
 * Core Pay-click pipeline — re-quote, reserve, KV, Stripe redirect.
 *
 * @param input - Pre-validated `InitiateCheckoutPaymentInput`
 * @param options - Optional checkout redirect origin from the incoming request
 */
export async function executeInitiateCheckoutPayment(
  input: InitiateCheckoutPaymentInput,
  options?: ExecuteInitiateCheckoutPaymentOptions,
): Promise<InitiateCheckoutPaymentResult> {
  const verified = verifyCheckoutHandoffToken(input.handoffToken);
  if (!verified.success) {
    if (verified.error === "expired") {
      return { success: false, error: CHECKOUT_HANDOFF_EXPIRED_ERROR };
    }

    return { success: false, error: CHECKOUT_HANDOFF_INVALID_ERROR };
  }

  const payload = verified.payload;
  const quoteResult = await computeTourBookingQuote(
    handoffPayloadToQuoteInput(payload),
  );

  if (!quoteResult.success) {
    if (quoteResult.error === CHECKOUT_SOLD_OUT_QUOTE_ERROR) {
      return {
        success: false,
        error: resolveCheckoutQuoteUnavailableMessage("sold_out"),
      };
    }

    return {
      success: false,
      error: resolveCheckoutQuoteUnavailableMessage("quote_error"),
    };
  }

  if (!clientQuoteMatchesServer(input.clientQuote, quoteResult.data)) {
    return { success: false, error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR };
  }

  const tourDetail = await getTourDetailById(payload.productId);
  if (!tourDetail.success) {
    return {
      success: false,
      error: resolveCheckoutQuoteUnavailableMessage("tour_detail_unavailable"),
    };
  }

  const rateId = tourDetail.data.defaultRateId;
  if (rateId == null) {
    console.error(
      `[checkout-payment] missing defaultRateId for product ${payload.productId}`,
    );
    return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
  }

  const contactRequirements = resolveMainContactRequirements(tourDetail.data);
  const contactValidation = validateCheckoutContactForProduct(
    input.contact,
    contactRequirements,
  );
  if (!contactValidation.success) {
    return { success: false, error: contactValidation.error };
  }

  const checkoutId = randomUUID();
  const productTitle =
    payload.productTitle?.trim() || tourDetail.data.title.trim() || "Tour booking";

  const reserveResult = await reserveBokunCheckout({
    productId: payload.productId,
    date: payload.date,
    startTimeId: payload.startTimeId,
    rateId,
    quote: quoteResult.data,
    language: payload.language,
    contact: {
      firstName: input.contact.firstName,
      lastName: input.contact.lastName,
      email: input.contact.email,
      phone: input.contact.phone,
      ...(input.contact.comments?.trim()
        ? { comments: input.contact.comments.trim() }
        : {}),
    },
    externalBookingReference: checkoutId,
  });

  if (!reserveResult.success) {
    return {
      success: false,
      error: resolveBokunReserveFailureMessage(reserveResult.error),
    };
  }

  const confirmationCode = reserveResult.data.confirmationCode;
  const handoffTokenDigest = hashCheckoutHandoffTokenForPendingCheckout(
    input.handoffToken,
  );
  if (!handoffTokenDigest) {
    await releaseBokunReservationAfterPaymentFailure(
      confirmationCode,
      checkoutId,
      "handoff digest",
    );
    return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
  }

  try {
    const termsAcceptedAt = new Date().toISOString();
    const pendingResult = await createPendingCheckout({
      id: checkoutId,
      productId: payload.productId,
      date: payload.date,
      startTimeId: payload.startTimeId,
      participants: payload.participants,
      language: payload.language,
      quoteSnapshot: quoteResult.data,
      contact: buildPendingCheckoutContact(input.contact, termsAcceptedAt),
      bokunConfirmationCode: confirmationCode,
      handoffTokenDigest,
    });

    if (!pendingResult.success) {
      await releaseBokunReservationAfterPaymentFailure(
        confirmationCode,
        checkoutId,
        "pending-checkout create",
      );
      return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
    }

    const stripeResult = await createStripeCheckoutSession({
      checkoutId,
      quote: quoteResult.data,
      customerEmail: input.contact.email,
      productTitle,
      handoffToken: input.handoffToken,
      checkoutOrigin: options?.checkoutOrigin,
    });

    if (!stripeResult.success) {
      await releaseBokunReservationAfterPaymentFailure(
        confirmationCode,
        checkoutId,
        "stripe session create",
      );
      return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
    }

    const updateResult = await updatePendingCheckout(checkoutId, {
      stripeSessionId: stripeResult.data.sessionId,
    });

    if (!updateResult.success) {
      await releaseBokunReservationAfterPaymentFailure(
        confirmationCode,
        checkoutId,
        "pending-checkout stripe index update",
      );
      return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
    }

    return {
      success: true,
      redirectUrl: stripeResult.data.url,
    };
  } catch (error) {
    console.error(
      `[checkout-payment] post-reserve failure for checkout ${checkoutId}:`,
      error instanceof Error ? error.message : String(error),
    );
    await releaseBokunReservationAfterPaymentFailure(
      confirmationCode,
      checkoutId,
      "post-reserve exception",
    );
    return { success: false, error: CHECKOUT_PAYMENT_UNAVAILABLE_ERROR };
  }
}

/**
 * Validates, re-quotes, reserves, persists, and redirects to Stripe Checkout.
 *
 * @param input - Untrusted Pay-click payload from checkout summary
 * @param options - Optional checkout redirect origin from the incoming request
 */
export async function runInitiateCheckoutPayment(
  input: unknown,
  options?: ExecuteInitiateCheckoutPaymentOptions,
): Promise<InitiateCheckoutPaymentResult> {
  const parsed = parseInitiateCheckoutPaymentInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return executeInitiateCheckoutPayment(parsed.data, options);
}
