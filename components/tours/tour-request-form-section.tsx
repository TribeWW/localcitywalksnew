"use client";

import TourRequestForm from "@/components/forms/TourRequestForm";

export default function TourRequestFormSection({
  cityName,
}: {
  cityName: string;
}) {
  // For inline forms, onClose resets rather than dismissing a modal.
  // Note: This requires TourRequestForm to expose a ref or callback to reset.
  return (
    <TourRequestForm
      cityName={cityName}
      onClose={() => {
        // No-op: form handles its own reset after calling onClose.
        // Consider adding scroll-to-top or visual feedback here.
      }}
    />
  );
}
