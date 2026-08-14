/**
 * structured-data/organization — unit tests for Organization JSON-LD builders.
 */

import { describe, expect, it } from "vitest";
import {
  buildOrganizationJsonLd,
  buildOrganizationProviderRef,
  ORGANIZATION_ID,
} from "@/lib/structured-data/organization";

describe("ORGANIZATION_ID", () => {
  it("uses the production origin with an #organization fragment", () => {
    expect(ORGANIZATION_ID).toBe(
      "https://www.localcitywalks.com/#organization",
    );
  });
});

describe("buildOrganizationJsonLd", () => {
  it("builds a full Organization document with logo and sameAs", () => {
    expect(buildOrganizationJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.localcitywalks.com/#organization",
      name: "LocalCityWalks",
      url: "https://www.localcitywalks.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.localcitywalks.com/lcw-logo-long-black-square.png",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://www.instagram.com/localcitywalks_official",
        "https://www.linkedin.com/company/localcitywalks",
        "https://www.google.com/maps?cid=16688941783586667517",
      ],
    });
  });
});

describe("buildOrganizationProviderRef", () => {
  it("returns a compact provider node sharing ORGANIZATION_ID", () => {
    expect(buildOrganizationProviderRef()).toEqual({
      "@type": "Organization",
      "@id": "https://www.localcitywalks.com/#organization",
      name: "LocalCityWalks",
      url: "https://www.localcitywalks.com",
    });
  });
});
