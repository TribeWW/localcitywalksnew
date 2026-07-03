/**
 * tour-page-metadata — unit tests for tour detail page metadata resolution.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getTourSeoMetadataMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/lib/tour-seo", () => ({
  getTourSeoMetadata: (...args: unknown[]) => getTourSeoMetadataMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import {
  buildTourPageMetadata,
  extractTourIdFromSlug,
  mergeTourSeoFields,
  resolveTourPageMetadata,
} from "@/lib/tour-page-metadata";

const FALLBACKS = {
  seoTitle: "Toledo Private Walking Tour | LocalCityWalks",
  metaDescription:
    "Discover Toledo with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.",
  focusKeyword: "toledo private walking tour",
};

describe("extractTourIdFromSlug", () => {
  it("returns the trailing numeric segment from a tour slug", () => {
    expect(extractTourIdFromSlug("hello-toledo-private-walk-1077682")).toBe(
      "1077682",
    );
  });

  it("returns null when the slug has no numeric suffix", () => {
    expect(extractTourIdFromSlug("hello-toledo-private-walk")).toBeNull();
    expect(extractTourIdFromSlug("")).toBeNull();
    expect(extractTourIdFromSlug("   ")).toBeNull();
  });
});

describe("mergeTourSeoFields", () => {
  it("prefers non-empty Sanity overrides over code fallbacks per field", () => {
    expect(
      mergeTourSeoFields(
        { seoTitle: "Custom title" },
        FALLBACKS,
      ),
    ).toEqual({
      seoTitle: "Custom title",
      metaDescription: FALLBACKS.metaDescription,
      focusKeyword: FALLBACKS.focusKeyword,
    });
  });

  it("uses fallbacks when Sanity document is null", () => {
    expect(mergeTourSeoFields(null, FALLBACKS)).toEqual(FALLBACKS);
  });
});

describe("buildTourPageMetadata", () => {
  it("returns title, description, and keywords when all fields are present", () => {
    expect(
      buildTourPageMetadata({
        seoTitle: "Best Toledo Walking Tour",
        metaDescription: "Explore Toledo with a local guide.",
        focusKeyword: "toledo private walking tour",
      }),
    ).toEqual({
      title: "Best Toledo Walking Tour",
      description: "Explore Toledo with a local guide.",
      keywords: "toledo private walking tour",
    });
  });

  it("returns only populated fields", () => {
    expect(
      buildTourPageMetadata({ seoTitle: "Best Toledo Walking Tour" }),
    ).toEqual({
      title: "Best Toledo Walking Tour",
    });
  });

  it("returns an empty object when all resolved fields are blank", () => {
    expect(buildTourPageMetadata(null)).toEqual({});
    expect(
      buildTourPageMetadata({
        seoTitle: "   ",
        metaDescription: "",
        focusKeyword: "  ",
      }),
    ).toEqual({});
  });

  it("includes canonical, openGraph, and twitter when context is provided", () => {
    const canonicalUrl =
      "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-walk-1077682";
    const ogImageUrl =
      "https://imgcdn.bokun.tools/example.jpg?w=660&h=660";

    expect(
      buildTourPageMetadata(
        {
          seoTitle: "Toledo Private Walking Tour | LocalCityWalks",
          metaDescription: "Discover Toledo with a local guide.",
          focusKeyword: "toledo private walking tour",
        },
        { canonicalUrl, ogImageUrl },
      ),
    ).toEqual({
      title: "Toledo Private Walking Tour | LocalCityWalks",
      description: "Discover Toledo with a local guide.",
      keywords: "toledo private walking tour",
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: "Toledo Private Walking Tour | LocalCityWalks",
        description: "Discover Toledo with a local guide.",
        url: canonicalUrl,
        type: "website",
        siteName: "LocalCityWalks",
        images: [
          {
            url: ogImageUrl,
            alt: "Toledo Private Walking Tour | LocalCityWalks",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Toledo Private Walking Tour | LocalCityWalks",
        description: "Discover Toledo with a local guide.",
        images: [ogImageUrl],
      },
    });
  });

  it("omits openGraph images and twitter images when ogImageUrl is null", () => {
    const canonicalUrl =
      "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682";

    const metadata = buildTourPageMetadata(
      { seoTitle: "Toledo Tour" },
      { canonicalUrl, ogImageUrl: null },
    );

    expect(metadata.alternates).toEqual({ canonical: canonicalUrl });
    expect(metadata.openGraph).toMatchObject({
      title: "Toledo Tour",
      url: canonicalUrl,
      type: "website",
      siteName: "LocalCityWalks",
    });
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Toledo Tour",
    });
    expect(metadata.twitter?.images).toBeUndefined();
  });
});

const BOKUN_DETAIL = {
  title: "Hello Toledo: Private 2-Hour Intro City Walk",
  googlePlace: {
    city: "Toledo",
    countryCode: "ES",
    country: "Spain",
    cityCode: "Toledo",
  },
  keyPhoto: {
    derived: [
      {
        name: "preview",
        url: "https://imgcdn.bokun.tools/example.jpg?w=300&h=300",
      },
      {
        name: "large",
        url: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
      },
    ],
  },
};

describe("resolveTourPageMetadata", () => {
  beforeEach(() => {
    getTourSeoMetadataMock.mockReset();
    getTourDetailByIdMock.mockReset();
  });

  it("merges Sanity overrides with code fallbacks from Bokun city", async () => {
    getTourSeoMetadataMock.mockResolvedValue({
      seoTitle: "Custom title",
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        title: "Hello Toledo",
        googlePlace: { city: "Toledo", countryCode: "ES", country: "Spain", cityCode: "Toledo" },
      },
    });

    await expect(
      resolveTourPageMetadata("toledo", "hello-toledo-private-walk-1077682"),
    ).resolves.toMatchObject({
      title: "Custom title",
      description: FALLBACKS.metaDescription,
      keywords: FALLBACKS.focusKeyword,
      alternates: {
        canonical:
          "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682",
      },
    });

    expect(getTourSeoMetadataMock).toHaveBeenCalledWith("1077682");
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("1077682");
  });

  it("uses code fallbacks when Sanity shell has empty override fields", async () => {
    getTourSeoMetadataMock.mockResolvedValue({
      seoTitle: null,
      metaDescription: null,
      focusKeyword: null,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        title: "Hello Toledo",
        googlePlace: { city: "Toledo", countryCode: "ES", country: "Spain", cityCode: "Toledo" },
      },
    });

    await expect(
      resolveTourPageMetadata("toledo", "hello-toledo-private-walk-1077682"),
    ).resolves.toMatchObject({
      title: FALLBACKS.seoTitle,
      description: FALLBACKS.metaDescription,
      keywords: FALLBACKS.focusKeyword,
      alternates: {
        canonical:
          "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682",
      },
    });
  });

  it("returns an empty object when the slug has no tour id", async () => {
    await expect(resolveTourPageMetadata("toledo", "invalid-slug")).resolves.toEqual({});
    expect(getTourSeoMetadataMock).not.toHaveBeenCalled();
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
  });

  it("returns an empty object when Bokun fails and Sanity has no overrides", async () => {
    getTourSeoMetadataMock.mockResolvedValue(null);
    getTourDetailByIdMock.mockResolvedValue({
      success: false,
      error: "Tour not found",
    });

    await expect(
      resolveTourPageMetadata("toledo", "hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({});
  });

  it("returns Sanity-only metadata when Bokun fails but overrides exist", async () => {
    getTourSeoMetadataMock.mockResolvedValue({
      seoTitle: "Sanity title",
      metaDescription: "Sanity description",
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: false,
      error: "Tour not found",
    });

    await expect(
      resolveTourPageMetadata("toledo", "hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({
      title: "Sanity title",
      description: "Sanity description",
    });
  });

  it("adds canonical, openGraph large image, and twitter tags from Bokun detail", async () => {
    getTourSeoMetadataMock.mockResolvedValue(null);
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: BOKUN_DETAIL,
    });

    const metadata = await resolveTourPageMetadata(
      "toledo",
      "hello-toledo-private-walk-1077682",
    );

    expect(metadata.alternates?.canonical).toBe(
      "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-2-hour-intro-city-walk-1077682",
    );
    expect(metadata.openGraph).toMatchObject({
      url: "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-2-hour-intro-city-walk-1077682",
      type: "website",
      siteName: "LocalCityWalks",
      images: [
        {
          url: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
          alt: FALLBACKS.seoTitle,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://imgcdn.bokun.tools/example.jpg?w=660&h=660"],
    });
  });

  it("uses route city param when Bokun googlePlace city is missing", async () => {
    getTourSeoMetadataMock.mockResolvedValue(null);
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        title: "Hello Mystery Walk",
        keyPhoto: { derived: [] },
      },
    });

    const metadata = await resolveTourPageMetadata(
      "fallback-city",
      "hello-mystery-walk-999",
    );

    expect(metadata.alternates?.canonical).toBe(
      "https://www.localcitywalks.com/tours/fallback-city/hello-mystery-walk-999",
    );
  });
});
