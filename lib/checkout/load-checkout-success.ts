/**
 * Loads checkout success data from Stripe session + KV row (LOC-1167 / PRD Task 4.3).
 *
 * Verifies payment via Stripe API, resolves the pending checkout by session id,
 * and returns either a confirmed booking reference or a confirming state while
 * the webhook finishes Bókun fulfilment.
 */

import { resolveStartTimeLabel } from "@/lib/actions/booking-widget-submit";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { buildCheckoutOrderFromPending } from "@/lib/checkout/build-checkout-order-from-pending";
import {
  getPendingCheckoutByStripeSessionId,
  PENDING_CHECKOUT_FULFILMENT_MAX_ATTEMPTS,
} from "@/lib/checkout/pending-checkout-store";
import { resolveCheckoutRecoveryTourPageHref } from "@/lib/checkout/resolve-checkout-recovery-href";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import { retrievePaidStripeCheckoutSession } from "@/lib/stripe/retrieve-paid-checkout-session";
import type { CheckoutOrderFixture } from "@/components/checkout/checkout-mock-fixture";

/** User-facing error when the success URL has no valid Stripe session. */
export const CHECKOUT_SUCCESS_INVALID_SESSION_MESSAGE =
  "This payment session isn't valid. Please contact support if you were charged.";

/** User-facing error when Stripe cannot be reached to verify payment. */
export const CHECKOUT_SUCCESS_UNAVAILABLE_MESSAGE =
  "We couldn't verify your payment right now. Please try again in a moment.";

/** User-facing error when the KV row is missing after a paid session. */
export const CHECKOUT_SUCCESS_NOT_FOUND_MESSAGE =
  "We couldn't find your booking details. If you were charged, please contact support with your payment confirmation.";

/** Success page with Bókun product confirmation code. */
export interface CheckoutSuccessReady {
  status: "ready";
  bookingReference: string;
  order: CheckoutOrderFixture;
}

/** Payment verified but webhook fulfilment still in progress. */
export interface CheckoutSuccessConfirming {
  status: "confirming";
  order: CheckoutOrderFixture;
}

/** Payment received but fulfilment failed after retries; support will follow up. */
export interface CheckoutSuccessNeedsSupport {
  status: "needs_support";
  message: string;
  tourPageHref: string;
}

/** Stripe session missing, unpaid, or not retrievable as paid. */
export interface CheckoutSuccessInvalidSession {
  status: "invalid_session";
  message: string;
}

/** KV row missing for a paid Stripe session. */
export interface CheckoutSuccessNotFound {
  status: "not_found";
  message: string;
  tourPageHref: string;
}

/** Infrastructure unavailable (Stripe or KV). */
export interface CheckoutSuccessUnavailable {
  status: "unavailable";
  message: string;
}

/** Discriminated union returned by `loadCheckoutSuccess`. */
export type LoadCheckoutSuccessResult =
  | CheckoutSuccessReady
  | CheckoutSuccessConfirming
  | CheckoutSuccessNeedsSupport
  | CheckoutSuccessInvalidSession
  | CheckoutSuccessNotFound
  | CheckoutSuccessUnavailable;

/**
 * Loads success page data for a Stripe Checkout Session id.
 *
 * @param sessionId - Raw `session_id` query param from `/checkout/success`
 */
export async function loadCheckoutSuccess(
  sessionId: string | null | undefined,
): Promise<LoadCheckoutSuccessResult> {
  const trimmedSessionId = sessionId?.trim();
  if (!trimmedSessionId) {
    return {
      status: "invalid_session",
      message: CHECKOUT_SUCCESS_INVALID_SESSION_MESSAGE,
    };
  }

  const stripeResult =
    await retrievePaidStripeCheckoutSession(trimmedSessionId);
  if (!stripeResult.success) {
    if (stripeResult.error === "unavailable") {
      return {
        status: "unavailable",
        message: CHECKOUT_SUCCESS_UNAVAILABLE_MESSAGE,
      };
    }

    return {
      status: "invalid_session",
      message: CHECKOUT_SUCCESS_INVALID_SESSION_MESSAGE,
    };
  }

  const pending = await getPendingCheckoutByStripeSessionId(trimmedSessionId);
  if (!pending) {
    return {
      status: "not_found",
      message: CHECKOUT_SUCCESS_NOT_FOUND_MESSAGE,
      tourPageHref: "/explore",
    };
  }

  const metadataCheckoutId = stripeResult.session.metadata?.checkoutId?.trim();
  if (metadataCheckoutId && metadataCheckoutId !== pending.id) {
    console.warn(
      `[checkout-success] session metadata checkoutId mismatch for ${trimmedSessionId}`,
    );
  }

  const detail = await getTourDetailById(pending.productId);
  const productTitle = detail.success
    ? detail.data.title.trim() || "Tour"
    : "Tour";
  const imageUrl = detail.success
    ? pickBokunCardImageUrl(detail.data.keyPhoto)
    : "/placeholder-city.jpg";
  const startTimeLabel = detail.success
    ? resolveStartTimeLabel(detail.data.startTimes, pending.startTimeId)
    : `Start time ${pending.startTimeId}`;

  const order = buildCheckoutOrderFromPending({
    pending,
    productTitle,
    imageUrl,
    startTimeLabel,
  });

  const bookingReference = pending.productConfirmationCode?.trim();
  if (bookingReference) {
    return {
      status: "ready",
      bookingReference,
      order,
    };
  }

  if (
    (pending.fulfilmentAttemptCount ?? 0) >=
    PENDING_CHECKOUT_FULFILMENT_MAX_ATTEMPTS
  ) {
    const tourPageHref = await resolveCheckoutRecoveryTourPageHref(
      pending.productId,
      detail.success ? detail.data.title : undefined,
    );
    const email = pending.contact.email;
    const stripeSessionId = pending.stripeSessionId ?? trimmedSessionId;

    return {
      status: "needs_support",
      tourPageHref,
      message:
        `Your payment was received, but we’re still confirming your booking. ` +
        `Our team will contact you at ${email} within 1 hour. ` +
        `Reference: ${stripeSessionId}.`,
    };
  }

  return {
    status: "confirming",
    order,
  };
}
