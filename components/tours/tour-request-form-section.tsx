"use client";

import TourRequestForm from "@/components/forms/TourRequestForm";

/**
 * Render a TourRequestForm preconfigured for the specified city.
 *
 * @param cityName - The city name to pass to the form (used for display and request context)
 * @returns The TourRequestForm React element configured for `cityName`
 */
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

