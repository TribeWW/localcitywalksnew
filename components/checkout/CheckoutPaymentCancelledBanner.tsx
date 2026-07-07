"use client";

/**
 * Info banner when the customer returns from Stripe Checkout cancel (LOC-1163).
 */

import { CHECKOUT_PAYMENT_CANCELLED_MESSAGE } from "@/lib/checkout/checkout-cancel-messages";
import { cn } from "@/lib/utils";

/**
 * Renders non-blocking guidance after a Stripe payment cancellation.
 */
export function CheckoutPaymentCancelledBanner() {
  return (
    <div
      role="alert"
      className={cn(
        "mb-6 rounded-lg border border-border bg-pearl-gray/60 px-4 py-4 text-left sm:mb-8",
      )}
    >
      <p className="text-sm font-medium text-nightsky">
        {CHECKOUT_PAYMENT_CANCELLED_MESSAGE}
      </p>
    </div>
  );
}
