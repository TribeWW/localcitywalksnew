/**
 * home-page-metadata — unit tests for homepage Next.js metadata.
 */

import { describe, expect, it } from "vitest";
import {
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  buildHomePageMetadata,
} from "@/lib/home/page-metadata";

describe("buildHomePageMetadata", () => {
  it("returns title, description, canonical, openGraph, and twitter tags", () => {
    expect(buildHomePageMetadata()).toEqual({
      title: HOME_PAGE_TITLE,
      description: HOME_PAGE_DESCRIPTION,
      alternates: {
        canonical: "https://www.localcitywalks.com/",
      },
      openGraph: {
        title: HOME_PAGE_TITLE,
        description: HOME_PAGE_DESCRIPTION,
        url: "https://www.localcitywalks.com/",
        type: "website",
        siteName: "LocalCityWalks",
        images: [
          {
            url: "https://www.localcitywalks.com/guide.png",
            height: 630,
            alt: HOME_PAGE_TITLE,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: HOME_PAGE_TITLE,
        description: HOME_PAGE_DESCRIPTION,
        images: ["https://www.localcitywalks.com/guide.png"],
      },
    });
  });

  it("applies Sanity overrides", () => {
    expect(buildHomePageMetadata({ seoTitle: "New home title" }).title).toBe(
      "New home title",
    );
  });
});
