/**
 * JSON-LD builder for the LocalCityWalks Organization entity (homepage only).
 *
 * Tour pages reference the same `@id` via TouristTrip `provider` so Google can
 * merge provider nodes into one Knowledge Graph entity.
 */

import { absoluteUrl, SITE_URL } from "@/lib/site";

const SCHEMA_CONTEXT = "https://schema.org";

/**
 * Stable schema.org `@id` for LocalCityWalks as an Organization.
 * Shared by homepage Organization JSON-LD and tour `provider` references.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Builds the full Organization document for the homepage.
 *
 * Includes logo ImageObject and sameAs profiles for Knowledge Graph matching.
 * Tour pages should not emit this document — only reference {@link ORGANIZATION_ID}.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "LocalCityWalks",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/lcw-logo-long-black-square.png"),
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://www.instagram.com/localcitywalks_official",
      "https://www.linkedin.com/company/localcitywalks",
      "https://www.google.com/maps?cid=16688941783586667517",
    ],
  };
}

/**
 * Compact Organization node for TouristTrip `provider` (name + url + shared @id).
 */
export function buildOrganizationProviderRef(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "LocalCityWalks",
    url: SITE_URL,
  };
}
