"use client";

/**
 * Step 1 footer for the booking widget (LOC-1063).
 *
 * Shown after date, time, language, guests, and price breakdown on the
 * configuring step. “Book now” advances to the contact step when the
 * selection is complete and a quote is available.
 */

import { Button } from "@/components/ui/button";
import BookingWidgetTrustBadge from "@/components/tours/booking-widget/BookingWidgetTrustBadge";
import { WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";

/** Props for `BookingWidgetStepOneFooter`. */
interface BookingWidgetStepOneFooterProps {
  /** When true, enables “Book now” (valid slot + participants + quote). */
  canBookNow: boolean;
  /** Called when the user clicks “Book now” to open step 2. */
  onBookNow: () => void;
}

/**
 * Renders the step-1 primary CTA and trust badge below the price breakdown.
 *
 * @param props.canBookNow - Parent-derived gate from form validity and quote state
 * @param props.onBookNow - Sets widget step to `"contact"`
 */
export default function BookingWidgetStepOneFooter({
  canBookNow,
  onBookNow,
}: BookingWidgetStepOneFooterProps) {
  return (
    <>
      <div className="pt-3">
        <Button
          type="button"
          className={WIDGET_PRIMARY_BUTTON_CLASS}
          disabled={!canBookNow}
          onClick={onBookNow}
        >
          Book now
        </Button>
      </div>
      <div className="my-4 h-px bg-border" />
      <BookingWidgetTrustBadge />
    </>
  );
}
