/**
 * Loads live checkout summary data from a handoff token (LOC-1154 / LOC-1155).
 *
 * Verifies the signed token, re-quotes server-side, and maps Bókun tour detail
 * into `CheckoutOrderFixture` for `CheckoutSummaryView`.
 */

import { computeTourBookingQuote } from "@/lib/actions/booking-widget.actions";
import { resolveStartTimeLabel } from "@/lib/actions/booking-widget-submit";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { buildCheckoutOrderFromHandoff } from "@/lib/checkout/build-checkout-order-from-handoff";
import {
  classifyCheckoutQuoteUnavailableReason,
  resolveCheckoutQuoteUnavailableMessage,
  type CheckoutHandoffErrorReason,
  type CheckoutQuoteUnavailableReason,
} from "@/lib/checkout/checkout-error-messages";
import { handoffPayloadToQuoteInput } from "@/lib/checkout/handoff-payload-to-quote-input";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import {
  verifyCheckoutHandoffToken,
  type CheckoutHandoffPayload,
} from "@/lib/checkout/handoff-token";
import { resolveCheckoutRecoveryTourPageHref } from "@/lib/checkout/resolve-checkout-recovery-href";
import { resolveCheckoutTourPageHref } from "@/lib/checkout/resolve-checkout-tour-page-href";
import { detectCheckoutPriceUpdate } from "@/lib/checkout/checkout-price-update";
import { resolveMainContactRequirements } from "@/lib/bokun/resolve-main-contact-requirements";
import type { CheckoutOrderFixture } from "@/components/checkout/checkout-mock-fixture";
import type { CheckoutPriceUpdate } from "@/lib/checkout/checkout-price-update";
import type { CheckoutContactRequirements } from "@/types/bokun";

export type { CheckoutHandoffErrorReason, CheckoutQuoteUnavailableReason };

/** Successful summary load with server-verified order recap. */
export interface CheckoutSummaryReady {
  status: "ready";
  order: CheckoutOrderFixture;
  productId: string;
  tourPageHref: string;
  handoffToken: string;
  /** Non-null when server re-quote differs from handoff `clientQuote`. */
  priceUpdate: CheckoutPriceUpdate | null;
  /** Per-field required flags from Bókun product main-contact metadata. */
  contactRequirements: CheckoutContactRequirements;
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
  reason: CheckoutQuoteUnavailableReason;
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
  if (
    reason === "missing" ||
    reason === "malformed" ||
    reason === "invalid_signature" ||
    reason === "invalid_payload"
  ) {
    return "This checkout link isn't valid. Please return to the tour page and try again.";
  }

  if (reason === "expired") {
    return "This checkout link has expired. Please return to the tour page and start again.";
  }

  return "Checkout is not available right now. Please try again later.";
}

async function resolveInvalidHandoffTourPageHref(
  recoveryPayload?: CheckoutHandoffPayload,
): Promise<string> {
  if (!recoveryPayload) {
    return resolveCheckoutTourPageHref("");
  }

  return resolveCheckoutRecoveryTourPageHref(
    recoveryPayload.productId,
    recoveryPayload.productTitle,
  );
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
      tourPageHref: await resolveInvalidHandoffTourPageHref(
        verified.recoveryPayload,
      ),
    };
  }

  const { payload } = verified;

  const detail = await getTourDetailById(payload.productId);
  if (!detail.success) {
    const reason = classifyCheckoutQuoteUnavailableReason(
      detail.error,
      "tour_detail",
    );

    return {
      status: "quote_unavailable",
      reason,
      productId: payload.productId,
      message: resolveCheckoutQuoteUnavailableMessage(reason),
      tourPageHref: await resolveCheckoutRecoveryTourPageHref(
        payload.productId,
        payload.productTitle,
      ),
    };
  }

  const productTitle =
    detail.data.title.trim() || payload.productTitle?.trim() || "Tour";
  const cityName = detail.data.googlePlace?.city;
  const tourPageHref = resolveCheckoutTourPageHref(
    payload.productId,
    productTitle,
    cityName,
  );

  const quoteResult = await computeTourBookingQuote(
    handoffPayloadToQuoteInput(payload),
  );

  if (!quoteResult.success) {
    const reason = classifyCheckoutQuoteUnavailableReason(
      quoteResult.error,
      "quote",
    );

    return {
      status: "quote_unavailable",
      reason,
      productId: payload.productId,
      message: resolveCheckoutQuoteUnavailableMessage(reason),
      tourPageHref,
    };
  }

  const imageUrl = pickBokunCardImageUrl(detail.data.keyPhoto);
  const startTimeLabel = resolveStartTimeLabel(
    detail.data.startTimes,
    payload.startTimeId,
  );

  const order = buildCheckoutOrderFromHandoff({
    payload,
    quote: quoteResult.data,
    productTitle,
    imageUrl,
    startTimeLabel,
  });

  const priceUpdate = detectCheckoutPriceUpdate(
    payload.clientQuote,
    quoteResult.data,
  );

  const contactRequirements = resolveMainContactRequirements(detail.data);

  return {
    status: "ready",
    order,
    productId: payload.productId,
    tourPageHref,
    handoffToken: trimmedToken,
    priceUpdate,
    contactRequirements,
  };
}
