"use client";

/**
 * Step 1 footer for the booking widget (LOC-1063 / LOC-1157).
 *
 * Shown after date, time, language, guests, and price breakdown on the
 * configuring step. In checkout mode, “Continue to checkout” starts the
 * handoff; legacy contact-step flow used “Book now”.
 */

import { Button } from "@/components/ui/button";
import BookingWidgetTrustBadge from "@/components/tours/booking-widget/BookingWidgetTrustBadge";
import { WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";

/** Primary CTA mode for step 1. */
export type BookingWidgetStepOneMode = "checkout" | "contact";

/** Props for `BookingWidgetStepOneFooter`. */
export interface BookingWidgetStepOneFooterProps {
  /** When true, enables the primary CTA (valid slot + participants + quote). */
  canBookNow: boolean;
  /** `checkout` → Continue to checkout; `contact` → Book now (legacy). */
  mode?: BookingWidgetStepOneMode;
  /** True while `startCheckoutHandoff` is in flight. */
  continuing?: boolean;
  /** Called when the user clicks the primary CTA. */
  onPrimaryAction: () => void;
}

/**
 * Renders the step-1 primary CTA and trust badge below the price breakdown.
 */
export default function BookingWidgetStepOneFooter({
  canBookNow,
  mode = "checkout",
  continuing = false,
  onPrimaryAction,
}: BookingWidgetStepOneFooterProps) {
  const label =
    mode === "checkout" ? "Continue to checkout" : "Book now";
  const disabled = !canBookNow || continuing;

  return (
    <>
      <div className="pt-3">
        <Button
          type="button"
          className={WIDGET_PRIMARY_BUTTON_CLASS}
          disabled={disabled}
          aria-busy={continuing}
          onClick={onPrimaryAction}
        >
          {label}
        </Button>
      </div>
      <div className="my-4 h-px bg-border" />
      <BookingWidgetTrustBadge />
    </>
  );
}
