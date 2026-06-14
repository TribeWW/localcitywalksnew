"use client";

/**
 * Tour-page request card — branches between legacy form and booking widget (LOC-1052).
 *
 * When `cardsWidgetUpdate` is true and `bookingBootstrap` is provided, renders
 * `BookingWidget`; otherwise keeps `TourRequestForm` for flag-off rollout and
 * `CustomTourBanner` parity.
 */

import TourRequestForm from "@/components/forms/TourRequestForm";
import BookingWidget from "@/components/tours/BookingWidget";
import type { BookingWidgetBootstrap } from "@/types/bokun";

/**
 * Renders the tour request UI inside the `#request` card on the product page.
 *
 * @param cityName - Locked city label passed to the form / widget
 * @param cardsWidgetUpdate - Vercel flag `cards-widget-update`
 * @param bookingBootstrap - Product context from `getTourDetailById`; required when flag is on
 */
export default function TourRequestFormSection({
  cityName,
  cardsWidgetUpdate = false,
  bookingBootstrap,
}: {
  cityName: string;
  /** Vercel Flag `cards-widget-update` — toggles booking widget vs legacy form. */
  cardsWidgetUpdate?: boolean;
  /** Product context from `getTourDetailById`; required when flag is on. */
  bookingBootstrap?: BookingWidgetBootstrap;
}) {
  if (cardsWidgetUpdate && bookingBootstrap) {
    return (
      <div data-cards-widget-update="true">
        <BookingWidget {...bookingBootstrap} />
      </div>
    );
  }

  return (
    <div data-cards-widget-update={cardsWidgetUpdate ? "true" : "false"}>
      <TourRequestForm
        initialCity={cityName}
        lockCity
        onClose={() => {
          // No-op: form handles its own reset after calling onClose.
        }}
      />
    </div>
  );
}
