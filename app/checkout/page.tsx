import type { Metadata } from "next";

import { CheckoutHandoffErrorView } from "@/components/checkout/CheckoutHandoffErrorView";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
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
    return <CheckoutSummaryView order={result.order} />;
  }

  if (result.status === "quote_unavailable") {
    return (
      <CheckoutHandoffErrorView
        message="This time slot is no longer available. Please choose another date or time."
        tourPageHref={result.tourPageHref}
      />
    );
  }

  return (
    <CheckoutHandoffErrorView
      message={resolveCheckoutHandoffErrorMessage(result.reason)}
      tourPageHref={result.tourPageHref}
    />
  );
}
