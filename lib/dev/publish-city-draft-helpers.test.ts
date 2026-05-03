import { describe, expect, it } from "vitest";
import { buildPublishedCityPayloadFromDraft } from "./publish-city-draft-helpers";

describe("buildPublishedCityPayloadFromDraft", () => {
  it("rejects ids that are not under drafts.", () => {
    expect(buildPublishedCityPayloadFromDraft({ _id: "city-paris" })).toEqual({
      ok: false,
      reason: "invalid-draft-id",
    });
  });

  it("maps drafts.city-x to published id and strips system fields", () => {
    const doc = {
      _id: "drafts.city-paris",
      _type: "city",
      _rev: "abc",
      _createdAt: "2020-01-01",
      _updatedAt: "2020-01-02",
      name: "Paris",
      cityCode: "paris",
    };
    const r = buildPublishedCityPayloadFromDraft(doc);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draftId).toBe("drafts.city-paris");
    expect(r.publishedId).toBe("city-paris");
    expect(r.payload._id).toBe("city-paris");
    expect(r.payload._type).toBe("city");
    expect(r.payload.name).toBe("Paris");
    expect(r.payload.cityCode).toBe("paris");
    expect(r.payload._rev).toBeUndefined();
    expect(r.payload._createdAt).toBeUndefined();
    expect(r.payload._updatedAt).toBeUndefined();
  });
});
