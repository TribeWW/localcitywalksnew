/**
 * Server component that emits TouristTrip JSON-LD for tour detail pages.
 */

import {
  buildTourPageJsonLd,
  type BuildTourPageJsonLdInput,
} from "@/lib/structured-data/tour";
import { JsonLd } from "@/lib/structured-data/json-ld";

/**
 * Renders schema.org `TouristTrip` structured data for a single tour page.
 *
 * Review and rating fields are included only when the same data is visible
 * on the page (pass `heroReviewStats` and `reviews` together).
 */
export function TourJsonLd(props: BuildTourPageJsonLdInput) {
  return <JsonLd data={buildTourPageJsonLd(props)} />;
}
