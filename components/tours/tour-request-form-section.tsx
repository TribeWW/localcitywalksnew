"use client";

import TourRequestForm from "@/components/forms/TourRequestForm";

export default function TourRequestFormSection({
  cityName,
}: {
  cityName: string;
}) {
  return (
    <TourRequestForm
      cityName={cityName}
      onClose={() => {
        // Inline form: on success we just keep the user on-page.
        // (TourRequestForm resets itself after calling onClose.)
      }}
    />
  );
}

