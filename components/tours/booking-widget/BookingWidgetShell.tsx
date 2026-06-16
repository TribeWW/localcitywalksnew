"use client";

/**
 * Sticky card shell for the tour-page booking widget (LOC-1063).
 *
 * Wraps all widget steps in a white bordered card that stays visible while
 * scrolling the tour detail page.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props for `BookingWidgetShell`. */
interface BookingWidgetShellProps {
  /** Widget content (from-price header, steps, form). */
  children: ReactNode;
  /** Optional extra classes on the outer card. */
  className?: string;
  /** Sticky `top` offset in pixels; defaults to `96` to clear the site header. */
  stickyTop?: number;
}

/**
 * Renders the booking widget card with sticky positioning.
 *
 * @param props.stickyTop - CSS `top` value for `position: sticky`
 */
export default function BookingWidgetShell({
  children,
  className,
  stickyTop = 96,
}: BookingWidgetShellProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-[1.5px] border-border bg-white p-6 shadow-sm",
        className,
      )}
      style={{ position: "sticky", top: stickyTop }}
    >
      {children}
    </div>
  );
}
