import { describe, expect, it } from "vitest";
import {
  cityCodeLookupCandidates,
  legacyBrokenCitySlug,
} from "@/lib/cities/legacy-city-code";
import { slugifyForUrl } from "@/lib/utils";

describe("legacyBrokenCitySlug", () => {
  it("reproduces the pre-fold broken city codes", () => {
    expect(legacyBrokenCitySlug("Tromsø")).toBe("troms");
    expect(legacyBrokenCitySlug("Wrocław")).toBe("wroc-aw");
  });

  it("still matches current slugs when NFD accents are enough", () => {
    expect(legacyBrokenCitySlug("Córdoba")).toBe("cordoba");
    expect(legacyBrokenCitySlug("Córdoba")).toBe(slugifyForUrl("Córdoba"));
  });
});

describe("cityCodeLookupCandidates", () => {
  it("includes both canonical and legacy codes for folded city names", () => {
    expect(cityCodeLookupCandidates("tromso", "Tromsø")).toEqual([
      "tromso",
      "troms",
    ]);
    expect(cityCodeLookupCandidates("wroclaw", "Wrocław")).toEqual([
      "wroclaw",
      "wroc-aw",
    ]);
  });

  it("does not duplicate when legacy and canonical match", () => {
    expect(cityCodeLookupCandidates("cordoba", "Córdoba")).toEqual([
      "cordoba",
    ]);
  });
});
