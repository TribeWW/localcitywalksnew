import type { Metadata } from "next";

import { CheckoutHandoffErrorView } from "@/components/checkout/CheckoutHandoffErrorView";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
import {
  resolveCheckoutHandoffErrorTitle,
  resolveCheckoutQuoteUnavailableTitle,
} from "@/lib/checkout/checkout-error-messages";
import { handleStripeCheckoutCancel } from "@/lib/checkout/handle-stripe-checkout-cancel";
import {
  loadCheckoutSummary,
  resolveCheckoutHandoffErrorMessage,
} from "@/lib/checkout/load-checkout-summary";
import { parseCheckoutCancelReturn } from "@/lib/checkout/parse-checkout-cancel-return";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your tour booking and complete payment securely.",
  robots: { index: false, follow: false },
};

/**
 * Live checkout summary — verifies handoff token, re-quotes, renders summary UI.
 *
 * When returning from Stripe cancel (`cancelled=1`), releases the Bókun hold
 * and shows recovery copy while preserving the original handoff token (LOC-1163).
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    h?: string;
    cancelled?: string;
    checkoutId?: string;
  }>;
}) {
  const params = await searchParams;
  const cancelReturn = parseCheckoutCancelReturn(params);

  if (cancelReturn.isPaymentCancelled && cancelReturn.checkoutId) {
    const cleanup = await handleStripeCheckoutCancel(cancelReturn.checkoutId);
    if (!cleanup.success && cleanup.error !== "not_found") {
      console.error(
        `[checkout] Stripe cancel cleanup failed for ${cancelReturn.checkoutId}`,
      );
    }
  }

  const result = await loadCheckoutSummary(params.h);

  if (result.status === "ready") {
    return (
      <CheckoutSummaryView
        order={result.order}
        priceUpdate={result.priceUpdate}
        tourPageHref={result.tourPageHref}
        handoffToken={result.handoffToken}
        paymentCancelled={cancelReturn.isPaymentCancelled}
      />
    );
  }

  if (result.status === "quote_unavailable") {
    return (
      <CheckoutHandoffErrorView
        title={resolveCheckoutQuoteUnavailableTitle(result.reason)}
        message={result.message}
        tourPageHref={result.tourPageHref}
      />
    );
  }

  return (
    <CheckoutHandoffErrorView
      title={resolveCheckoutHandoffErrorTitle(result.reason)}
      message={resolveCheckoutHandoffErrorMessage(result.reason)}
      tourPageHref={result.tourPageHref}
    />
  );
}
