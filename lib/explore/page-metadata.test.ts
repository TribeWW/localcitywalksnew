/**
 * explore-page-metadata — unit tests for explore page Next.js metadata.
 */

import { describe, expect, it } from "vitest";
import {
  EXPLORE_JSON_LD_NAME,
  EXPLORE_PAGE_DESCRIPTION,
  EXPLORE_PAGE_KEYWORDS,
  EXPLORE_PAGE_TITLE,
  buildExplorePageMetadata,
} from "@/lib/explore/page-metadata";

describe("buildExplorePageMetadata", () => {
  it("uses the explore SEO title, description, and keywords", () => {
    expect(EXPLORE_PAGE_TITLE).toBe(
      "Private Walking Tours in 150+ European Cities | LocalCityWalks",
    );
    expect(EXPLORE_PAGE_DESCRIPTION).toBe(
      "Browse private walking tours with vetted local guides across 150+ European cities. Personal, insightful walks with authentic local stories.",
    );
    expect(EXPLORE_PAGE_KEYWORDS).toBe("private walking tours europe");
    expect(EXPLORE_JSON_LD_NAME).toBe("Private Walking Tours in Europe");
  });

  it("returns title, description, canonical, openGraph, and twitter tags", () => {
    expect(buildExplorePageMetadata()).toEqual({
      title: EXPLORE_PAGE_TITLE,
      description: EXPLORE_PAGE_DESCRIPTION,
      keywords: EXPLORE_PAGE_KEYWORDS,
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
