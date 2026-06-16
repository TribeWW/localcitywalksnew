"use client";

/**
 * Collapsed booking widget state (LOC-1063).
 *
 * Initial view before the user expands the widget: primary CTA plus trust badge.
 * Parent sets `widgetOpen` when “Check availability” is clicked.
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BookingWidgetTrustBadge from "@/components/tours/booking-widget/BookingWidgetTrustBadge";
import { WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";

/** Props for `BookingWidgetCollapsed`. */
interface BookingWidgetCollapsedProps {
  /** Called when the user clicks “Check availability” to open step 1. */
  onCheckAvailability: () => void;
  /** Optional wrapper classes. */
  className?: string;
}

/**
 * Renders the collapsed CTA row and divider above the trust badge.
 *
 * @param props.onCheckAvailability - Expands the widget into the configuring step
 */
export default function BookingWidgetCollapsed({
  onCheckAvailability,
  className,
}: BookingWidgetCollapsedProps) {
  return (
    <div className={cn(className)}>
      <Button
        type="button"
        className={WIDGET_PRIMARY_BUTTON_CLASS}
        onClick={onCheckAvailability}
      >
        Check availability
      </Button>
      <div className="my-4 h-px bg-border" />
      <BookingWidgetTrustBadge />
    </div>
  );
}
