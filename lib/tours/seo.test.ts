/**
 * tour-seo — unit tests for published Tour SEO metadata fetch helper.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

import { TOUR_SEO_QUERY, getTourSeoMetadata } from "@/lib/tours/seo";

describe("getTourSeoMetadata", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns published seoTitle, metaDescription, focusKeyword, and GEO fields for a valid tour id", async () => {
    fetchMock.mockResolvedValue({
      seoTitle: "Best Toledo Walking Tour",
      metaDescription: "Explore Toledo with a local guide.",
      focusKeyword: "toledo private walking tour",
      aiSummary: "Private walking tour in Toledo, about 2 hours.",
      sameAsUrl: "https://www.wikidata.org/wiki/Q583",
      faq: [
        {
          _key: "a",
          question: "How long is the Hello Toledo tour?",
          answer: "About 2 hours.",
        },
      ],
    });

    await expect(getTourSeoMetadata("1077682")).resolves.toEqual({
      seoTitle: "Best Toledo Walking Tour",
      metaDescription: "Explore Toledo with a local guide.",
      focusKeyword: "toledo private walking tour",
      aiSummary: "Private walking tour in Toledo, about 2 hours.",
      sameAsUrl: "https://www.wikidata.org/wiki/Q583",
      faq: [
        {
          _key: "a",
          question: "How long is the Hello Toledo tour?",
          answer: "About 2 hours.",
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(TOUR_SEO_QUERY, { tourId: "1077682" });
  });

  it("returns null when Sanity has no matching published document", async () => {
    fetchMock.mockResolvedValue(null);

    await expect(getTourSeoMetadata("9751538")).resolves.toBeNull();
  });

  it("returns null for invalid tour ids without calling Sanity", async () => {
    await expect(getTourSeoMetadata("")).resolves.toBeNull();
    await expect(getTourSeoMetadata("  ")).resolves.toBeNull();
    await expect(getTourSeoMetadata("tour-42")).resolves.toBeNull();
    await expect(getTourSeoMetadata("42a")).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims whitespace from valid tour ids before querying Sanity", async () => {
    fetchMock.mockResolvedValue({ seoTitle: "Trimmed title" });

    await expect(getTourSeoMetadata("  1107331  ")).resolves.toEqual({
      seoTitle: "Trimmed title",
    });

    expect(fetchMock).toHaveBeenCalledWith(TOUR_SEO_QUERY, { tourId: "1107331" });
  });

  it("returns null and logs when the Sanity fetch fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(getTourSeoMetadata("15683")).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "[Tour SEO] Sanity fetch failed",
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it("projects GEO fields used by tour JSON-LD", () => {
    expect(TOUR_SEO_QUERY).toContain("aiSummary");
    expect(TOUR_SEO_QUERY).toContain("sameAsUrl");
    expect(TOUR_SEO_QUERY).toContain("faq[]{ _key, question, answer }");
  });
});
