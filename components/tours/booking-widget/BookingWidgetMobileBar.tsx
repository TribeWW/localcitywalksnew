"use client";

/**
 * Fixed bottom booking bar for small screens (&lt;md).
 *
 * Shown after the user scrolls past {@link MOBILE_BAR_SCROLL_THRESHOLD_PX}.
 * Parent controls scroll-gated `visible` state; this component only handles
 * presentation and the “Check availability” tap target.
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BookingWidgetFromPrice from "@/components/tours/booking-widget/BookingWidgetFromPrice";
import { WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";

/** Scroll offset (px) before the mobile bar slides into view. */
export const MOBILE_BAR_SCROLL_THRESHOLD_PX = 240;

/** Props for {@link BookingWidgetMobileBar}. */
export interface BookingWidgetMobileBarProps {
  /** When false, bar is off-screen and non-interactive (transform/opacity). */
  visible: boolean;
  /** Lowest adult unit price from bootstrap. */
  amount?: number;
  /** ISO currency code paired with `amount`. */
  currency?: string;
  /** Opens the full-screen configure drawer. */
  onCheckAvailability: () => void;
  /** Optional extra classes (e.g. `md:hidden`). */
  className?: string;
}

/**
 * Renders the compact price + “Check availability” fixed bar.
 *
 * @param props.visible - Drives `translateY` / `opacity` / `pointer-events`
 * @param props.onCheckAvailability - Called when the primary CTA is tapped
 */
export default function BookingWidgetMobileBar({
  visible,
  amount,
  currency,
  onCheckAvailability,
  className,
}: BookingWidgetMobileBarProps) {
  return (
    <div
      data-testid="booking-mobile-bar"
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[45] flex items-center justify-between gap-4 border-t-[1.5px] border-border bg-white p-4 shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] transition-[transform,opacity] duration-200 ease-out md:hidden",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
        className,
      )}
    >
      <BookingWidgetFromPrice
        amount={amount}
        currency={currency}
        size="compact"
      />
      <Button
        type="button"
        tabIndex={visible ? undefined : -1}
        className={cn(WIDGET_PRIMARY_BUTTON_CLASS, "w-auto shrink-0 px-7 py-3")}
        onClick={onCheckAvailability}
      >
        Check availability
      </Button>
    </div>
  );
}
