/**
 * contact-page-metadata — unit tests for contact page Next.js metadata.
 */

import { describe, expect, it } from "vitest";
import {
  CONTACT_PAGE_DESCRIPTION,
  CONTACT_PAGE_KEYWORDS,
  CONTACT_PAGE_TITLE,
  buildContactPageMetadata,
} from "@/lib/contact/page-metadata";

describe("buildContactPageMetadata", () => {
  it("uses the contact SEO title, description, and keywords", () => {
    expect(CONTACT_PAGE_TITLE).toBe("Contact us | LocalCityWalks");
    expect(CONTACT_PAGE_DESCRIPTION).toBe(
      "Questions about a booking, a custom request, or joining as a local guide? Get in touch with the LocalCityWalks team and we'll help you sort it out.",
    );
    expect(CONTACT_PAGE_KEYWORDS).toBe("contact localcitywalks");
  });

  it("returns title, description, canonical, openGraph, and twitter tags", () => {
    expect(buildContactPageMetadata()).toEqual({
      title: CONTACT_PAGE_TITLE,
      description: CONTACT_PAGE_DESCRIPTION,
      keywords: CONTACT_PAGE_KEYWORDS,
      alternates: {
        canonical: "https://www.localcitywalks.com/contact",
      },
      openGraph: {
        title: CONTACT_PAGE_TITLE,
        description: CONTACT_PAGE_DESCRIPTION,
        url: "https://www.localcitywalks.com/contact",
        type: "website",
        siteName: "LocalCityWalks",
        images: [
          {
            url: "https://www.localcitywalks.com/guide.png",
            alt: CONTACT_PAGE_TITLE,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: CONTACT_PAGE_TITLE,
        description: CONTACT_PAGE_DESCRIPTION,
        images: ["https://www.localcitywalks.com/guide.png"],
      },
    });
  });
});
