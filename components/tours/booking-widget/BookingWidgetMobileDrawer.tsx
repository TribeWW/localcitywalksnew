"use client";

/**
 * Full-screen booking drawer for small screens (&lt;md).
 *
 * Hosts the configure step (date, time, language, guests, checkout CTA).
 * Body scroll lock is owned by the parent `BookingWidget`.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props for {@link BookingWidgetMobileDrawer}. */
export interface BookingWidgetMobileDrawerProps {
  /** When true, renders the full-screen dialog shell. */
  open: boolean;
  /** Called when the user dismisses the drawer (close button or Escape). */
  onClose: () => void;
  /** Configure step content (form fields + footer). */
  children: ReactNode;
  /** Optional extra classes (e.g. `md:hidden`). */
  className?: string;
}

/**
 * Full-screen overlay with header and scrollable body for the configure step.
 *
 * @param props.open - Controls mount and visibility
 * @param props.onClose - Invoked on close button click or Escape key
 */
export default function BookingWidgetMobileDrawer({
  open,
  onClose,
  children,
  className,
}: BookingWidgetMobileDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      data-testid="booking-mobile-drawer"
      className={cn(
        "fixed inset-0 z-[70] flex flex-col bg-white md:hidden",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Select dates and guests"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b-[1.5px] border-border px-6 py-4">
        <div className="text-base font-semibold text-nightsky">
          Select dates &amp; guests
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          className="-m-2 flex cursor-pointer border-none bg-transparent p-2"
          onClick={onClose}
        >
          <X className="size-[22px] text-nightsky" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
