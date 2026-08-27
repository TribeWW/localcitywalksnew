/**
 * RelatedToursSection — async Suspense child that loads related tour cards.
 *
 * Presentational {@link RelatedToursView} lives in this module for colocated
 * unit tests. The tour page must not await related data; wrap this in
 * `<Suspense fallback={<RelatedToursSkeleton />}>`.
 */

import CityCard from "@/components/cards/CityCard";
import {
  getRelatedTours,
  type GetRelatedToursInput,
} from "@/lib/tours/related-tours/get-related-tours";
import type { CityCardData } from "@/types/bokun";

/**
 * Props for the async related-tours Suspense child (from the tour page).
 */
export type RelatedToursSectionProps = GetRelatedToursInput;

/**
 * Props for the presentational related-tours block.
 */
export type RelatedToursViewProps = {
  /** Section heading from the selector (geography / spotlight copy). */
  heading: string;
  /** Up to 4 related listing cards (current product already excluded). */
  cards: CityCardData[];
  /** Vercel Flag `cards-widget-update` — forwarded to {@link CityCard}. */
  cardsWidgetUpdate: boolean;
};

/**
 * Presentational related-tours section: heading + {@link CityCard} grid.
 * Returns `null` when `cards` is empty (no empty heading).
 */
export function RelatedToursView({
  heading,
  cards,
  cardsWidgetUpdate,
}: RelatedToursViewProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 w-full" aria-labelledby="related-tours-heading">
      <h2
        id="related-tours-heading"
        className="b-2 text-2xl font-semibold text-[#0F172A]"
      >
        {heading}
      </h2>
      <CityCard
        cities={cards}
        noHorizontalPadding
        cardsWidgetUpdate={cardsWidgetUpdate}
      />
    </section>
  );
}

/**
 * Async Server Component: loads related tours via {@link getRelatedTours} and
 * renders {@link RelatedToursView}, or `null` when there is nothing to show.
 *
 * Safe to suspend under React `Suspense` without blocking hero/booking/reviews.
 */
export default async function RelatedToursSection(
  props: RelatedToursSectionProps,
) {
  const result = await getRelatedTours(props);
  if (!result) {
    return null;
  }

  return (
    <RelatedToursView
      heading={result.heading}
      cards={result.cards}
      cardsWidgetUpdate={props.cardsWidgetUpdate}
    />
  );
}
