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
import {
  BOOKING_MOBILE_DRAWER_Z_CLASS,
  isBookingStackedOverlayOpen,
} from "@/components/tours/booking-widget/stacked-overlay-layer";

/** Selector for tabbable elements inside the drawer focus trap. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Returns visible, enabled focusable elements within `container`.
 *
 * @param container - Drawer root element
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.tabIndex !== -1 && !element.hasAttribute("disabled"),
  );
}

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
 * @param props.open - Controls mount, initial focus, and focus restoration on close
 * @param props.onClose - Invoked on close button click or document Escape key
 */
export default function BookingWidgetMobileDrawer({
  open,
  onClose,
  children,
  className,
}: BookingWidgetMobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isBookingStackedOverlayOpen()) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusable = getFocusableElements(drawerRef.current);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !drawerRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !drawerRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={drawerRef}
      data-testid="booking-mobile-drawer"
      className={cn(
        "fixed inset-0 flex flex-col bg-white md:hidden",
        BOOKING_MOBILE_DRAWER_Z_CLASS,
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Select dates and guests"
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
