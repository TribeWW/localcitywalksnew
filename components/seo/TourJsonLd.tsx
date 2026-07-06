/**
 * Server component that emits tour page JSON-LD (`TouristTrip`, and `Product` when reviews are shown).
 */

import {
  buildTourPageJsonLd,
  type BuildTourPageJsonLdInput,
} from "@/lib/structured-data/tour";
import { JsonLd } from "@/lib/structured-data/json-ld";

/**
 * Renders schema.org structured data for a single tour page.
 *
 * Without visible reviews, emits a `TouristTrip` document. When reviews are shown,
 * emits `@graph` with separate `TouristTrip` and `Product` nodes so ratings validate
 * in Google rich results.
 */
export function TourJsonLd(props: BuildTourPageJsonLdInput) {
  return <JsonLd data={buildTourPageJsonLd(props)} />;
}
