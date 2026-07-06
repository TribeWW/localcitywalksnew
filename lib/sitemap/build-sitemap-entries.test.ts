/**
 * sitemap/build-sitemap-entries — unit tests for sitemap URL builders.
 */

import { describe, expect, it } from "vitest";
import type { CityCardData } from "@/types/bokun";
import {
  buildFullSitemapEntries,
  buildStaticSitemapEntries,
  buildTourSitemapEntries,
} from "@/lib/sitemap/build-sitemap-entries";

const fixedNow = new Date("2026-07-06T12:00:00.000Z");

const sampleTours: CityCardData[] = [
  {
    id: "1077682",
    title: "Toledo",
    image: "https://example.com/toledo.jpg",
    citySlug: "toledo",
    slug: "hello-toledo-private-walk-1077682",
  },
  {
    id: "9751538",
    title: "Arles",
    image: "https://example.com/arles.jpg",
    citySlug: "arles",
    slug: "hello-arles-private-walk-9751538",
  },
];

describe("buildStaticSitemapEntries", () => {
  it("includes home and explore on the www origin", () => {
    expect(buildStaticSitemapEntries({ now: fixedNow })).toEqual([
      {
        url: "https://www.localcitywalks.com/",
        lastModified: fixedNow,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: "https://www.localcitywalks.com/explore",
        lastModified: fixedNow,
        changeFrequency: "daily",
        priority: 0.9,
      },
    ]);
  });

  it("does not include checkout, preview, studio, or api paths", () => {
    const urls = buildStaticSitemapEntries({ now: fixedNow }).map((e) => e.url);
    expect(urls).not.toContain(expect.stringContaining("/checkout"));
    expect(urls).not.toContain(expect.stringContaining("/preview"));
    expect(urls).not.toContain(expect.stringContaining("/studio"));
    expect(urls).not.toContain(expect.stringContaining("/api/"));
  });
});

describe("buildTourSitemapEntries", () => {
  it("maps catalog rows to canonical tour URLs", () => {
    expect(buildTourSitemapEntries(sampleTours, { now: fixedNow })).toEqual([
      {
        url: "https://www.localcitywalks.com/tours/toledo/hello-toledo-private-walk-1077682",
        lastModified: fixedNow,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: "https://www.localcitywalks.com/tours/arles/hello-arles-private-walk-9751538",
        lastModified: fixedNow,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ]);
  });

  it("skips rows missing citySlug or slug", () => {
    const items: CityCardData[] = [
      { id: "1", title: "A", image: "", citySlug: "a", slug: "tour-a-1" },
      { id: "2", title: "B", image: "", slug: "tour-b-2" },
      { id: "3", title: "C", image: "", citySlug: "c" },
    ];

    expect(buildTourSitemapEntries(items, { now: fixedNow })).toHaveLength(1);
  });

  it("deduplicates identical tour URLs", () => {
    const duplicate: CityCardData = {
      id: "1077682",
      title: "Toledo",
      image: "",
      citySlug: "toledo",
      slug: "hello-toledo-private-walk-1077682",
    };

    expect(
      buildTourSitemapEntries([duplicate, duplicate], { now: fixedNow }),
    ).toHaveLength(1);
  });
});

describe("buildFullSitemapEntries", () => {
  it("merges static routes with tour detail URLs", () => {
    const entries = buildFullSitemapEntries(sampleTours, { now: fixedNow });

    expect(entries).toHaveLength(4);
    expect(entries[0].url).toBe("https://www.localcitywalks.com/");
    expect(entries[1].url).toBe("https://www.localcitywalks.com/explore");
    expect(entries[2].url).toContain("/tours/toledo/");
    expect(entries[3].url).toContain("/tours/arles/");
  });
});
