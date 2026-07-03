/**
 * explore-page-metadata — unit tests for explore page Next.js metadata.
 */

import { describe, expect, it } from "vitest";
import {
  EXPLORE_PAGE_DESCRIPTION,
  EXPLORE_PAGE_TITLE,
  buildExplorePageMetadata,
} from "@/lib/explore-page-metadata";

describe("buildExplorePageMetadata", () => {
  it("returns title, description, canonical, openGraph, and twitter tags", () => {
    expect(buildExplorePageMetadata()).toEqual({
      title: EXPLORE_PAGE_TITLE,
      description: EXPLORE_PAGE_DESCRIPTION,
      alternates: {
        canonical: "https://www.localcitywalks.com/explore",
      },
      openGraph: {
        title: EXPLORE_PAGE_TITLE,
        description: EXPLORE_PAGE_DESCRIPTION,
        url: "https://www.localcitywalks.com/explore",
        type: "website",
        siteName: "LocalCityWalks",
        images: [
          {
            url: "https://www.localcitywalks.com/guide.png",
            alt: EXPLORE_PAGE_TITLE,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: EXPLORE_PAGE_TITLE,
        description: EXPLORE_PAGE_DESCRIPTION,
        images: ["https://www.localcitywalks.com/guide.png"],
      },
    });
  });
});
