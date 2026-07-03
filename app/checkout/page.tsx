import type { Metadata } from "next";

import { CheckoutHandoffErrorView } from "@/components/checkout/CheckoutHandoffErrorView";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
import {
  resolveCheckoutHandoffErrorTitle,
  resolveCheckoutQuoteUnavailableTitle,
} from "@/lib/checkout/checkout-error-messages";
import {
  loadCheckoutSummary,
  resolveCheckoutHandoffErrorMessage,
} from "@/lib/checkout/load-checkout-summary";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your tour booking and complete payment securely.",
  robots: { index: false, follow: false },
};

/**
 * Live checkout summary — verifies handoff token, re-quotes, renders summary UI.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ h?: string }>;
}) {
  const { h } = await searchParams;
  const result = await loadCheckoutSummary(h);

  if (result.status === "ready") {
    return (
      <CheckoutSummaryView
        order={result.order}
        priceUpdate={result.priceUpdate}
        tourPageHref={result.tourPageHref}
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
