/**
 * Server component that emits tour page JSON-LD (`TouristTrip`, and `Product` when reviews are shown).
 */

import {
  buildTourPageJsonLd,
  type BuildTourPageJsonLdInput,
} from "@/lib/structured-data/tour";
import {
  buildFaqPageJsonLd,
  filterValidFaqItems,
} from "@/lib/structured-data/faq";
import { JsonLd } from "@/lib/structured-data/json-ld";
import type { TourSeoFaqItem } from "@/types/tour-seo";

type TourJsonLdProps = BuildTourPageJsonLdInput & {
  /** Tour-specific FAQ from Sanity; emitted as a separate FAQPage script. */
  faq?: TourSeoFaqItem[] | null;
};

/**
 * Renders schema.org structured data for a single tour page.
 *
 * Without visible reviews, emits a `TouristTrip` document. When reviews are shown,
 * emits `@graph` with separate `TouristTrip` and `Product` nodes so ratings validate
 * in Google rich results. When Sanity FAQ items are valid, emits a second `FAQPage`
 * JSON-LD script.
 */
export function TourJsonLd({ faq, ...tripInput }: TourJsonLdProps) {
  const faqJsonLd = buildFaqPageJsonLd(filterValidFaqItems(faq));

  return (
    <>
      <JsonLd data={buildTourPageJsonLd(tripInput)} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
    </>
  );
}
