import { describe, expect, it } from "vitest";
import {
  DRAFT_PREFIX,
  cityDocIdentityIds,
  docsInCityIdentityGroup,
} from "@/lib/cities/city-doc-identity";

describe("cityDocIdentityIds", () => {
  it("maps a published id to published and draft pair", () => {
    expect(cityDocIdentityIds("city-troms")).toEqual({
      publishedId: "city-troms",
      draftId: "drafts.city-troms",
    });
  });

  it("maps a draft id to the same published and draft pair", () => {
    expect(cityDocIdentityIds("drafts.city-troms")).toEqual({
      publishedId: "city-troms",
      draftId: "drafts.city-troms",
    });
  });

  it("uses the shared draft prefix", () => {
    expect(DRAFT_PREFIX).toBe("drafts.");
    expect(cityDocIdentityIds("city-x").draftId.startsWith(DRAFT_PREFIX)).toBe(
      true,
    );
  });
});

describe("docsInCityIdentityGroup", () => {
  const docs = [
    { _id: "city-troms", cityCode: "troms" },
    { _id: "drafts.city-troms", cityCode: "troms" },
    { _id: "city-wroc-aw", cityCode: "wroc-aw" },
    { _id: "drafts.city-wroc-aw", cityCode: "wroc-aw" },
  ];

  it("includes published and draft versions for a published id", () => {
    expect(docsInCityIdentityGroup(docs, "city-troms")).toEqual([
      { _id: "city-troms", cityCode: "troms" },
      { _id: "drafts.city-troms", cityCode: "troms" },
    ]);
  });

  it("includes published and draft versions for a draft id", () => {
    expect(docsInCityIdentityGroup(docs, "drafts.city-troms")).toEqual([
      { _id: "city-troms", cityCode: "troms" },
      { _id: "drafts.city-troms", cityCode: "troms" },
    ]);
  });

  it("excludes unrelated legacy city ids", () => {
    const group = docsInCityIdentityGroup(docs, "city-troms");
    expect(group.map((d) => d._id)).not.toContain("city-wroc-aw");
    expect(group.map((d) => d._id)).not.toContain("drafts.city-wroc-aw");
  });
});
