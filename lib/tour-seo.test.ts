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

import { TOUR_SEO_QUERY, getTourSeoMetadata } from "@/lib/tour-seo";

describe("getTourSeoMetadata", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns published seoTitle and metaDescription for a valid tour id", async () => {
    fetchMock.mockResolvedValue({
      seoTitle: "Best Toledo Walking Tour",
      metaDescription: "Explore Toledo with a local guide.",
    });

    await expect(getTourSeoMetadata("1077682")).resolves.toEqual({
      seoTitle: "Best Toledo Walking Tour",
      metaDescription: "Explore Toledo with a local guide.",
    });

    expect(fetchMock).toHaveBeenCalledWith(TOUR_SEO_QUERY, { tourId: "1077682" });
  });

  it("returns null when Sanity has no matching published document", async () => {
    fetchMock.mockResolvedValue(null);

    await expect(getTourSeoMetadata("1077682")).resolves.toBeNull();
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

    await expect(getTourSeoMetadata("  1077682  ")).resolves.toEqual({
      seoTitle: "Trimmed title",
    });

    expect(fetchMock).toHaveBeenCalledWith(TOUR_SEO_QUERY, { tourId: "1077682" });
  });

  it("returns null and logs when the Sanity fetch fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(getTourSeoMetadata("1077682")).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "[Tour SEO] Sanity fetch failed",
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
