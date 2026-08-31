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

export interface TourRequestModalShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
}

export default function TourRequestModalShell({
  open,
  onClose,
  children,
  titleId = "custom-tour-title",
}: TourRequestModalShellProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

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
