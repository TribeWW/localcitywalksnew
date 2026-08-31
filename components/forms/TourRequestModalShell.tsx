"use client";

/**
 * Responsive modal shell for the custom tour request form (CustomTourBanner).
 *
 * Mobile: full-screen panel without backdrop.
 * Desktop: centered dialog with semi-transparent backdrop.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBookingStackedOverlayOpen } from "@/components/tours/booking-widget/stacked-overlay-layer";

export interface TourRequestModalShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.tabIndex !== -1 && !element.hasAttribute("disabled"),
  );
}

export default function TourRequestModalShell({
  open,
  onClose,
  children,
  titleId = "custom-tour-title",
}: TourRequestModalShellProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (isBookingStackedOverlayOpen()) {
        return;
      }

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = getFocusableElements(modalRef.current);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !modalRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !modalRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-white font-body md:items-center md:bg-transparent md:p-4"
    >
      <div
        className="absolute inset-0 hidden bg-black/50 md:block"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex h-full w-full max-w-none flex-col bg-white md:h-auto md:max-h-[90vh] md:max-w-[480px] md:rounded-lg md:border-[1.5px] md:border-border md:shadow-lg">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex cursor-pointer items-center rounded-md border-none bg-transparent p-1 text-muted-foreground transition-colors hover:text-nightsky"
        >
          <X className="size-5" aria-hidden />
        </button>

        <div
          className={cn(
            "flex-1 overflow-y-auto p-6 md:p-8",
            "md:rounded-lg",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
