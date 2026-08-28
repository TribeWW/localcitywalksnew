"use client";

/**
 * Card shell for the tour-page booking widget (LOC-1063).
 *
 * Sticky positioning is applied on the tour page sidebar wrapper (`lg:sticky`)
 * so the widget can stick within the full-height grid column.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props for `BookingWidgetShell`. */
interface BookingWidgetShellProps {
  /** Widget content (from-price header, steps, form). */
  children: ReactNode;
  /** Optional extra classes on the outer card. */
  className?: string;
  /** @deprecated Sticky offset is owned by the tour page sidebar wrapper. */
  stickyTop?: number;
}

/**
 * Renders the booking widget card chrome.
 */
export default function BookingWidgetShell({
  children,
  className,
}: BookingWidgetShellProps) {
  return (
    <div
      className={cn(
        "w-full self-start rounded-lg border-[1.5px] border-border bg-white p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
