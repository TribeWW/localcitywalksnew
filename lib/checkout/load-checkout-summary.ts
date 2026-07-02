/**
 * Loads live checkout summary data from a handoff token (LOC-1154).
 *
 * Verifies the signed token, re-quotes server-side, and maps Bókun tour detail
 * into `CheckoutOrderFixture` for `CheckoutSummaryView`.
 */

import { computeTourBookingQuote } from "@/lib/actions/booking-widget.actions";
import { resolveStartTimeLabel } from "@/lib/actions/booking-widget-submit";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { buildCheckoutOrderFromHandoff } from "@/lib/checkout/build-checkout-order-from-handoff";
import { handoffPayloadToQuoteInput } from "@/lib/checkout/handoff-payload-to-quote-input";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import {
  verifyCheckoutHandoffToken,
  type VerifyCheckoutHandoffError,
} from "@/lib/checkout/handoff-token";
import { resolveCheckoutTourPageHref } from "@/lib/checkout/resolve-checkout-tour-page-href";
import type { CheckoutOrderFixture } from "@/components/checkout/checkout-mock-fixture";

/** Why a handoff token could not be used on `/checkout`. */
export type CheckoutHandoffErrorReason =
  | "missing"
  | VerifyCheckoutHandoffError;

/** Successful summary load with server-verified order recap. */
export interface CheckoutSummaryReady {
  status: "ready";
  order: CheckoutOrderFixture;
  productId: string;
  tourPageHref: string;
  handoffToken: string;
}

/** Invalid or expired handoff token. */
export interface CheckoutSummaryInvalidHandoff {
  status: "invalid_handoff";
  reason: CheckoutHandoffErrorReason;
  tourPageHref: string;
}

/** Slot unavailable or quote pipeline failure after valid handoff. */
export interface CheckoutSummaryQuoteUnavailable {
  status: "quote_unavailable";
  productId: string;
  message: string;
  tourPageHref: string;
}

/** Discriminated union returned by `loadCheckoutSummary`. */
export type LoadCheckoutSummaryResult =
  | CheckoutSummaryReady
  | CheckoutSummaryInvalidHandoff
  | CheckoutSummaryQuoteUnavailable;

/**
 * User-facing copy for invalid handoff states on the checkout page.
 *
 * @param reason - Handoff failure reason from token verification
 */
export function resolveCheckoutHandoffErrorMessage(
  reason: CheckoutHandoffErrorReason,
): string {
  if (reason === "missing" || reason === "malformed" || reason === "invalid_signature" || reason === "invalid_payload") {
    return "This checkout link isn't valid. Please return to the tour page and try again.";
  }

  if (reason === "expired") {
    return "This checkout link has expired. Please return to the tour page and start again.";
  }

  return "Checkout is not available right now. Please try again later.";
}

/**
 * Verifies `h`, re-quotes the selection, and builds summary order data.
 *
 * @param handoffToken - Raw `h` query param from `/checkout`
 */
export async function loadCheckoutSummary(
  handoffToken: string | null | undefined,
): Promise<LoadCheckoutSummaryResult> {
  const trimmedToken = handoffToken?.trim();

  if (!trimmedToken) {
    return {
      status: "invalid_handoff",
      reason: "missing",
      tourPageHref: resolveCheckoutTourPageHref(""),
    };
  }

  const verified = verifyCheckoutHandoffToken(trimmedToken);
  if (!verified.success) {
    return {
      status: "invalid_handoff",
      reason: verified.error,
      tourPageHref: resolveCheckoutTourPageHref(""),
    };
  }

  const { payload } = verified;

  const detail = await getTourDetailById(payload.productId);
  const productTitle =
    (detail.success ? detail.data.title.trim() : "") ||
    payload.productTitle?.trim() ||
    "Tour";
  const cityName = detail.success ? detail.data.googlePlace?.city : undefined;
  const tourPageHref = resolveCheckoutTourPageHref(
    payload.productId,
    productTitle,
    cityName,
  );

  const quoteResult = await computeTourBookingQuote(
    handoffPayloadToQuoteInput(payload),
  );

  if (!quoteResult.success) {
    return {
      status: "quote_unavailable",
      productId: payload.productId,
      message: quoteResult.error,
      tourPageHref,
    };
  }
  const imageUrl = detail.success
    ? pickBokunCardImageUrl(detail.data.keyPhoto)
    : "/placeholder-city.jpg";
  const startTimeLabel = detail.success
    ? resolveStartTimeLabel(detail.data.startTimes, payload.startTimeId)
    : `Start time ${payload.startTimeId}`;

  const order = buildCheckoutOrderFromHandoff({
    payload,
    quote: quoteResult.data,
    productTitle,
    imageUrl,
    startTimeLabel,
  });

  return {
    status: "ready",
    order,
    productId: payload.productId,
    tourPageHref,
    handoffToken: trimmedToken,
  };
}
