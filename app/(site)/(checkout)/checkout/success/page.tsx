import type { Metadata } from "next";

import { CheckoutHandoffErrorView } from "@/components/checkout/CheckoutHandoffErrorView";
import { CheckoutSuccessConfirmingView } from "@/components/checkout/CheckoutSuccessConfirmingView";
import { CheckoutSuccessView } from "@/components/checkout/CheckoutSuccessView";
import { loadCheckoutSuccess } from "@/lib/checkout/load-checkout-success";

export const metadata: Metadata = {
  title: "Booking confirmed",
  description: "Your LocalCityWalks tour booking is confirmed.",
  robots: { index: false, follow: false },
};

/**
 * Post-payment success page — verifies Stripe session + KV fulfilment (LOC-1167).
 *
 * Never trusts client-only success flags; booking reference comes from the KV
 * row after webhook fulfilment. Shows a confirming state while the webhook
 * persists the Bókun product confirmation code.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;
  const result = await loadCheckoutSuccess(sessionId);
  if (result.status === "ready") {
    return (
      <CheckoutSuccessView
        bookingReference={result.bookingReference}
        order={result.order}
      />
    );
  }

  if (result.status === "confirming") {
    return <CheckoutSuccessConfirmingView order={result.order} />;
  }

  if (result.status === "needs_support") {
    return (
      <CheckoutHandoffErrorView
        title="We’re still confirming your booking"
        message={result.message}
        tourPageHref={result.tourPageHref}
      />
    );
  }

  if (result.status === "not_found") {
    return (
      <CheckoutHandoffErrorView
        title="Booking not found"
        message={result.message}
        tourPageHref={result.tourPageHref}
      />
    );
  }

  if (result.status === "unavailable") {
    return (
      <CheckoutHandoffErrorView
        title="Please try again"
        message={result.message}
        tourPageHref="/explore"
      />
    );
  }

  return (
    <CheckoutHandoffErrorView
      title="Payment session invalid"
      message={result.message}
      tourPageHref="/explore"
    />
  );
}
