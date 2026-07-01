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
});

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
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({
      title: "Custom title",
      description: FALLBACKS.metaDescription,
      keywords: FALLBACKS.focusKeyword,
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
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({
      title: FALLBACKS.seoTitle,
      description: FALLBACKS.metaDescription,
      keywords: FALLBACKS.focusKeyword,
    });
  });

  it("returns an empty object when the slug has no tour id", async () => {
    await expect(resolveTourPageMetadata("invalid-slug")).resolves.toEqual({});
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
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
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
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({
      title: "Sanity title",
      description: "Sanity description",
    });
  });
});
