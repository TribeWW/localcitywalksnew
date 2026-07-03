"use client";

/**
 * Price-updated banner for checkout summary (LOC-1156).
 *
 * Shown when server re-quote differs from the widget handoff snapshot.
 * Customer must acknowledge the new total before Pay is enabled.
 */

import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { resolveCheckoutPriceUpdatedBannerMessage } from "@/lib/checkout/checkout-price-update";
import type { CheckoutPriceUpdate } from "@/lib/checkout/checkout-price-update";
import { cn } from "@/lib/utils";

import { CHECKOUT_CHECKBOX_CLASS } from "./checkout-field-styles";

export interface CheckoutPriceUpdatedBannerProps {
  /** Previous vs current totals from `detectCheckoutPriceUpdate`. */
  priceUpdate: CheckoutPriceUpdate;
  /** Tour page link when customer prefers to reconfigure in the widget. */
  tourPageHref: string;
  acknowledged: boolean;
  onAcknowledgedChange: (acknowledged: boolean) => void;
}

/**
 * Renders the price-change alert, acknowledgement checkbox, and return link.
 */
export function CheckoutPriceUpdatedBanner({
  priceUpdate,
  tourPageHref,
  acknowledged,
  onAcknowledgedChange,
}: CheckoutPriceUpdatedBannerProps) {
  const message = resolveCheckoutPriceUpdatedBannerMessage(priceUpdate);

  return (
    <div
      role="alert"
      className={cn(
        "mb-6 rounded-lg border border-tangerine/40 bg-pearl-gray/60 px-4 py-4 text-left sm:mb-8",
      )}
    >
      <p className="mb-4 text-sm font-medium text-nightsky">{message}</p>

      <div className="mb-4 flex items-start gap-3">
        <Checkbox
          id="checkout-price-updated"
          checked={acknowledged}
          onCheckedChange={(checked) =>
            onAcknowledgedChange(checked === true)
          }
          className={CHECKOUT_CHECKBOX_CLASS}
          aria-required
        />
        <Label
          htmlFor="checkout-price-updated"
          className="text-sm font-normal leading-relaxed text-nightsky"
        >
          I accept the updated total
        </Label>
      </div>

      <Link
        href={tourPageHref}
        className="text-sm font-medium text-watermelon underline underline-offset-[3px] hover:text-tangerine"
      >
        Return to tour
      </Link>
    </div>
  );
}
