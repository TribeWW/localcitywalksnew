/**
 * extract-guided-languages — guided language extraction from Bókun guidanceTypes.
 */

import { describe, expect, it } from "vitest";
import {
  extractGuidedLanguagesFromGuidanceTypes,
  normalizeBokunLanguageCode,
  resolveLanguageOptionsForSlot,
} from "@/lib/bokun/extract-guided-languages";
import type { BokunGuidanceType } from "@/types/bokun";

const guidedEntry: BokunGuidanceType = {
  guidanceType: "GUIDED",
  languages: ["en", "es"],
  displayLanguages: ["English", "Spanish"],
};

describe("normalizeBokunLanguageCode", () => {
  it("treats en and EN_GB as the same base code", () => {
    expect(normalizeBokunLanguageCode("en")).toBe("en");
    expect(normalizeBokunLanguageCode("EN_GB")).toBe("en");
  });
});

describe("extractGuidedLanguagesFromGuidanceTypes", () => {
  it("returns displayLanguages with codes from the GUIDED entry", () => {
    expect(
      extractGuidedLanguagesFromGuidanceTypes([guidedEntry]),
    ).toEqual([
      { code: "en", label: "English" },
      { code: "es", label: "Spanish" },
    ]);
  });

  it("ignores non-GUIDED guidance types", () => {
    expect(
      extractGuidedLanguagesFromGuidanceTypes([
        {
          guidanceType: "HEADPHONES",
          languages: ["de"],
          displayLanguages: ["German"],
        },
        guidedEntry,
      ]),
    ).toEqual([
      { code: "en", label: "English" },
      { code: "es", label: "Spanish" },
    ]);
  });

  it("returns empty when guidanceTypes is missing", () => {
    expect(extractGuidedLanguagesFromGuidanceTypes(undefined)).toEqual([]);
  });
});

describe("resolveLanguageOptionsForSlot", () => {
  const productOptions = extractGuidedLanguagesFromGuidanceTypes([guidedEntry]);

  it("keeps product display labels for matching slot codes", () => {
    expect(resolveLanguageOptionsForSlot(["es"], productOptions)).toEqual([
      { code: "es", label: "Spanish" },
    ]);
  });

  it("narrows to slot codes while preserving labels", () => {
    expect(resolveLanguageOptionsForSlot(["en"], productOptions)).toEqual([
      { code: "en", label: "English" },
    ]);
  });

  it("prefers exact product code before normalized map lookup", () => {
    const options = [
      { code: "en", label: "English (generic)" },
      { code: "EN_GB", label: "English (UK)" },
    ];

    expect(resolveLanguageOptionsForSlot(["EN_GB"], options)).toEqual([
      { code: "EN_GB", label: "English (UK)" },
    ]);
  });
});
