/**
 * pick-bokun-photo-url — unit tests for Bókun photo URL selection helpers.
 */

import { describe, expect, it } from "vitest";
import {
  BOKUN_DERIVED_HERO_PREFERENCE,
  BOKUN_DERIVED_OG_PREFERENCE,
  pickBokunDerivedPhotoUrl,
  pickBokunHeroPhotoUrl,
  pickBokunOgImageUrl,
} from "./pick-bokun-photo-url";

const sampleKeyPhoto = {
  originalUrl:
    "https://bokun.s3.amazonaws.com/8e10a382-1dfd-4db1-a801-c646a125331b.jpg",
  derived: [
    {
      name: "thumbnail",
      url: "https://imgcdn.bokun.tools/example.jpg?w=80&h=80&mode=crop",
    },
    {
      name: "preview",
      url: "https://imgcdn.bokun.tools/example.jpg?w=300&h=300",
    },
    {
      name: "large",
      url: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
    },
  ],
};

describe("BOKUN_DERIVED_OG_PREFERENCE", () => {
  it("prefers large then preview for social / schema images", () => {
    expect(BOKUN_DERIVED_OG_PREFERENCE).toEqual(["large", "preview"]);
  });
});

describe("BOKUN_DERIVED_HERO_PREFERENCE", () => {
  it("prefers large then preview then thumbnail for gallery fallbacks", () => {
    expect(BOKUN_DERIVED_HERO_PREFERENCE).toEqual([
      "large",
      "preview",
      "thumbnail",
    ]);
  });
});

describe("pickBokunDerivedPhotoUrl", () => {
  it("returns the first matching derived URL for the given preference order", () => {
    expect(pickBokunDerivedPhotoUrl(sampleKeyPhoto, ["large", "preview"])).toBe(
      "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
    );
  });

  it("falls back to the next preference when the first size is missing", () => {
    expect(
      pickBokunDerivedPhotoUrl(
        {
          derived: [
            {
              name: "preview",
              url: "https://imgcdn.bokun.tools/example.jpg?w=300&h=300",
            },
          ],
        },
        ["large", "preview"],
      ),
    ).toBe("https://imgcdn.bokun.tools/example.jpg?w=300&h=300");
  });

  it("returns any derived URL when no preference name matches", () => {
    expect(
      pickBokunDerivedPhotoUrl(
        {
          derived: [
            {
              name: "custom",
              url: "https://imgcdn.bokun.tools/custom.jpg",
            },
          ],
        },
        ["large"],
      ),
    ).toBe("https://imgcdn.bokun.tools/custom.jpg");
  });

  it("returns null when photo has no derived entries", () => {
    expect(pickBokunDerivedPhotoUrl(null, ["large"])).toBeNull();
    expect(pickBokunDerivedPhotoUrl({}, ["large"])).toBeNull();
    expect(pickBokunDerivedPhotoUrl({ derived: [] }, ["large"])).toBeNull();
  });
});

describe("pickBokunHeroPhotoUrl", () => {
  it("prefers originalUrl over derived sizes for hero quality", () => {
    expect(pickBokunHeroPhotoUrl(sampleKeyPhoto)).toBe(
      "https://bokun.s3.amazonaws.com/8e10a382-1dfd-4db1-a801-c646a125331b.jpg",
    );
  });

  it("falls back to large derived when originalUrl is absent", () => {
    expect(
      pickBokunHeroPhotoUrl({
        derived: sampleKeyPhoto.derived,
      }),
    ).toBe("https://imgcdn.bokun.tools/example.jpg?w=660&h=660");
  });

  it("returns null when no usable photo URL exists", () => {
    expect(pickBokunHeroPhotoUrl(null)).toBeNull();
    expect(pickBokunHeroPhotoUrl({})).toBeNull();
  });
});

describe("pickBokunOgImageUrl", () => {
  it("returns the large derived URL for Open Graph metadata", () => {
    expect(pickBokunOgImageUrl(sampleKeyPhoto)).toBe(
      "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
    );
  });

  it("does not use originalUrl (OG uses CDN derived sizes only)", () => {
    expect(pickBokunOgImageUrl(sampleKeyPhoto)).not.toBe(
      sampleKeyPhoto.originalUrl,
    );
  });

  it("returns null when no derived image is available", () => {
    expect(
      pickBokunOgImageUrl({ originalUrl: sampleKeyPhoto.originalUrl }),
    ).toBeNull();
  });
});
