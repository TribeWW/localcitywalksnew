"use client";

/**
 * Icon-in-field wrapper for booking widget inputs (LOC-1063).
 *
 * Positions a leading Lucide icon inside date, time, language, and contact
 * controls. Children receive full width via descendant selectors.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props for `BookingWidgetField`. */
interface BookingWidgetFieldProps {
  /** Leading icon component (rendered decorative with `aria-hidden`). */
  icon: LucideIcon;
  /** Form control (`Input`, `DatePicker` trigger, `TimeSelector`, etc.). */
  children: ReactNode;
  /** Optional classes on the outer relative wrapper. */
  className?: string;
}

/**
 * Wraps a form control with a left-aligned icon and consistent padding offset.
 *
 * @param props.icon - Lucide icon shown at `left-3.5`; must not capture pointer events
 */
export default function BookingWidgetField({
  icon: Icon,
  children,
  className,
}: BookingWidgetFieldProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Icon
        className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted-foreground"
        aria-hidden
      />
      <div className="w-full [&_button]:w-full [&_select]:w-full">{children}</div>
    </div>
  );
}
