/**
 * tour-page-metadata — unit tests for tour detail page metadata resolution.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getTourSeoMetadataMock = vi.fn();

vi.mock("@/lib/tour-seo", () => ({
  getTourSeoMetadata: (...args: unknown[]) => getTourSeoMetadataMock(...args),
}));

import {
  buildTourPageMetadata,
  extractTourIdFromSlug,
  resolveTourPageMetadata,
} from "@/lib/tour-page-metadata";

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

describe("buildTourPageMetadata", () => {
  it("returns title and description when both Sanity fields are present", () => {
    expect(
      buildTourPageMetadata({
        seoTitle: "Best Toledo Walking Tour",
        metaDescription: "Explore Toledo with a local guide.",
      }),
    ).toEqual({
      title: "Best Toledo Walking Tour",
      description: "Explore Toledo with a local guide.",
    });
  });

  it("returns only title when metaDescription is missing", () => {
    expect(
      buildTourPageMetadata({ seoTitle: "Best Toledo Walking Tour" }),
    ).toEqual({
      title: "Best Toledo Walking Tour",
    });
  });

  it("returns only description when seoTitle is missing", () => {
    expect(
      buildTourPageMetadata({
        metaDescription: "Explore Toledo with a local guide.",
      }),
    ).toEqual({
      description: "Explore Toledo with a local guide.",
    });
  });

  it("returns an empty object when Sanity metadata is null", () => {
    expect(buildTourPageMetadata(null)).toEqual({});
  });

  it("ignores blank strings so layout defaults can apply", () => {
    expect(
      buildTourPageMetadata({
        seoTitle: "   ",
        metaDescription: "",
      }),
    ).toEqual({});
  });
});

describe("resolveTourPageMetadata", () => {
  beforeEach(() => {
    getTourSeoMetadataMock.mockReset();
  });

  it("loads Sanity metadata using the id extracted from the slug", async () => {
    getTourSeoMetadataMock.mockResolvedValue({
      seoTitle: "Custom title",
      metaDescription: "Custom description",
    });

    await expect(
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({
      title: "Custom title",
      description: "Custom description",
    });

    expect(getTourSeoMetadataMock).toHaveBeenCalledWith("1077682");
  });

  it("returns an empty object when the slug has no tour id", async () => {
    await expect(resolveTourPageMetadata("invalid-slug")).resolves.toEqual({});
    expect(getTourSeoMetadataMock).not.toHaveBeenCalled();
  });

  it("returns an empty object when Sanity has no SEO document", async () => {
    getTourSeoMetadataMock.mockResolvedValue(null);

    await expect(
      resolveTourPageMetadata("hello-toledo-private-walk-1077682"),
    ).resolves.toEqual({});
  });
});
