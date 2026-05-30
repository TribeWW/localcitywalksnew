"use client";

import TourRequestForm from "@/components/forms/TourRequestForm";

export default function TourRequestFormSection({
  cityName,
  cardsWidgetUpdate = false,
}: {
  cityName: string;
  /** Vercel Flag `cards-widget-update` — use for booking-widget rollout / pre-fill. */
  cardsWidgetUpdate?: boolean;
}) {
  // For inline forms, onClose resets rather than dismissing a modal.
  // Note: This requires TourRequestForm to expose a ref or callback to reset.
  return (
    <div data-cards-widget-update={cardsWidgetUpdate ? "true" : "false"}>
      <TourRequestForm
        initialCity={cityName}
        lockCity
        onClose={() => {
          // No-op: form handles its own reset after calling onClose.
          // Consider adding scroll-to-top or visual feedback here.
        }}
      />
    </div>
  );
}
