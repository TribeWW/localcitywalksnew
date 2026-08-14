/**
 * Server component that emits Organization JSON-LD for the homepage only.
 */

import { buildOrganizationJsonLd } from "@/lib/structured-data/organization";
import { JsonLd } from "@/lib/structured-data/json-ld";

/**
 * Renders schema.org Organization structured data (logo, sameAs, stable @id).
 *
 * Mount only on `/` — tour pages reference the same `@id` via TouristTrip provider.
 */
export function OrganizationJsonLd() {
  return <JsonLd data={buildOrganizationJsonLd()} />;
}
