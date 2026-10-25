import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

import { PAGE_SEO_QUERY, getPageSeo } from "@/lib/pages/page-seo";

describe("getPageSeo", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("queries the published document by fixed id", async () => {
    fetchMock.mockResolvedValue(null);

    await expect(getPageSeo("explorePage")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      PAGE_SEO_QUERY,
      { id: "explorePage" },
      { next: { revalidate: 60 } },
    );
    expect(PAGE_SEO_QUERY).toContain('!(_id in path("drafts.**"))');
  });

  it("resolves the share image to a 1200×630 crop URL", async () => {
    fetchMock.mockResolvedValue({
      seoTitle: "Title",
      ogImage: {
        asset: { _ref: "image-abc123-2400x1260-jpg", _type: "reference" },
        alt: "Alt text",
      },
    });

    const seo = await getPageSeo("homePage");

    expect(seo).toMatchObject({ seoTitle: "Title", ogImageAlt: "Alt text" });
    expect(seo?.ogImageUrl).toContain("abc123-2400x1260.jpg");
    expect(seo?.ogImageUrl).toContain("w=1200");
    expect(seo?.ogImageUrl).toContain("h=630");
    expect(seo).not.toHaveProperty("ogImage");
  });

  it("returns no image URL when the image has no asset", async () => {
    fetchMock.mockResolvedValue({ ogTitle: "Share", ogImage: null });

    await expect(getPageSeo("contactPage")).resolves.toEqual({
      ogTitle: "Share",
      ogImageUrl: null,
      ogImageAlt: null,
    });
  });

  it("returns null when the Sanity fetch fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network"));

    await expect(getPageSeo("homePage")).resolves.toBeNull();
  });
});
