/**
 * page-metadata — unit tests for the Sanity override merge on page metadata.
 */

import { describe, expect, it } from "vitest";
import {
  buildPageMetadata,
  type PageMetadataDefaults,
} from "@/lib/pages/page-metadata";

const defaults: PageMetadataDefaults = {
  title: "Default title",
  description: "Default description",
  keywords: "default keyword",
  canonicalUrl: "https://www.localcitywalks.com/page",
  ogImage: { url: "https://www.localcitywalks.com/guide.png" },
};

describe("buildPageMetadata", () => {
  it("returns the code defaults when Sanity has no document", () => {
    expect(buildPageMetadata(defaults, null)).toEqual({
      title: "Default title",
      description: "Default description",
      keywords: "default keyword",
      alternates: { canonical: "https://www.localcitywalks.com/page" },
      openGraph: {
        title: "Default title",
        description: "Default description",
        url: "https://www.localcitywalks.com/page",
        type: "website",
        siteName: "LocalCityWalks",
        images: [
          {
            url: "https://www.localcitywalks.com/guide.png",
            alt: "Default title",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Default title",
        description: "Default description",
        images: ["https://www.localcitywalks.com/guide.png"],
      },
    });
  });

  it("keeps the code defaults for empty or blank Sanity fields", () => {
    expect(
      buildPageMetadata(defaults, {
        seoTitle: "   ",
        metaDescription: "",
        focusKeyword: null,
        ogTitle: " ",
        ogDescription: null,
        ogImageUrl: null,
        ogImageAlt: "",
      }),
    ).toEqual(buildPageMetadata(defaults, null));
  });

  it("uses the SEO title and description for share tags when share fields are empty", () => {
    const metadata = buildPageMetadata(defaults, {
      seoTitle: " Sanity title ",
      metaDescription: "Sanity description",
      focusKeyword: "sanity keyword",
    });

    expect(metadata.title).toBe("Sanity title");
    expect(metadata.description).toBe("Sanity description");
    expect(metadata.keywords).toBe("sanity keyword");
    expect(metadata.openGraph).toMatchObject({
      title: "Sanity title",
      description: "Sanity description",
      images: [
        {
          url: "https://www.localcitywalks.com/guide.png",
          alt: "Sanity title",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      title: "Sanity title",
      description: "Sanity description",
    });
  });

  it("uses the Sanity share fields and image when they are set", () => {
    const metadata = buildPageMetadata(defaults, {
      ogTitle: "Share title",
      ogDescription: "Share description",
      ogImageUrl: "https://cdn.sanity.io/images/p/d/share.jpg?w=1200&h=630",
      ogImageAlt: "Guide in front of a cathedral",
    });

    expect(metadata.title).toBe("Default title");
    expect(metadata.openGraph).toMatchObject({
      title: "Share title",
      description: "Share description",
      images: [
        {
          url: "https://cdn.sanity.io/images/p/d/share.jpg?w=1200&h=630",
          width: 1200,
          height: 630,
          alt: "Guide in front of a cathedral",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      title: "Share title",
      description: "Share description",
      images: ["https://cdn.sanity.io/images/p/d/share.jpg?w=1200&h=630"],
    });
  });

  it("omits keywords when neither Sanity nor the defaults set them", () => {
    expect(
      buildPageMetadata({ ...defaults, keywords: undefined }, null),
    ).not.toHaveProperty("keywords");
  });
});
