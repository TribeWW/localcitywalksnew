"use client";

/**
 * Free-cancellation trust block for the booking widget (LOC-1063).
 *
 * Displayed below primary CTAs in collapsed and step-1 states to reinforce
 * the cancellation policy before the user commits to booking details.
 */

import { BadgeCheck } from "lucide-react";

/**
 * Renders the “Free cancellation / Until 24 hours before activity” trust copy.
 *
 * Icon is decorative; policy text is exposed to screen readers as static content.
 */
export default function BookingWidgetTrustBadge() {
  return (
    <div className="flex items-start gap-1.5 pt-4">
      <BadgeCheck
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600"
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-foreground leading-snug">
          Free cancellation
        </p>
        <p className="text-sm text-muted-foreground leading-snug">
          Until 24 hours before activity
        </p>
      </div>
    </div>
  );
}
