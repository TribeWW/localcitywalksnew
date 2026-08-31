"use client";

/**
 * Success toast shown after a custom tour request is submitted.
 */

import { Check, X } from "lucide-react";

interface TourRequestSuccessToastProps {
  onDismiss: () => void;
}

export default function TourRequestSuccessToast({
  onDismiss,
}: TourRequestSuccessToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[70] flex max-w-[360px] items-start gap-3 rounded-lg bg-nightsky px-6 py-4 shadow-lg"
    >
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500">
        <Check className="size-3 text-white" aria-hidden />
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold text-white">Request sent!</p>
        <p className="text-xs leading-relaxed text-white/80">
          A local guide will be in touch within one business day.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 flex shrink-0 cursor-pointer items-center border-none bg-transparent p-1 text-white/60 transition-colors hover:text-white"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
