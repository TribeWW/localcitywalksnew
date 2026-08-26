/**
 * place-seo-fields.helpers — unit tests for shared place/tour SEO field helpers.
 */

import { describe, expect, it } from "vitest";
import {
  PLACE_SEO_FAQ_MIN_WHEN_REQUIRED,
  PLACE_SEO_FIELDSET_NAME,
  getPlaceSeoCopy,
  resolvePlaceSeoFieldOptions,
  resolvePlaceSeoFieldsetOptions,
  validateOptionalNonBlankString,
} from "./place-seo-fields.helpers";

describe("resolvePlaceSeoFieldsetOptions", () => {
  it("defaults to a collapsible SEO group that starts collapsed", () => {
    expect(resolvePlaceSeoFieldsetOptions()).toEqual({
      name: PLACE_SEO_FIELDSET_NAME,
      title: "SEO",
      collapsible: true,
      collapsed: true,
    });
  });

  it("allows starting expanded (e.g. tour SEO documents)", () => {
    expect(resolvePlaceSeoFieldsetOptions({ collapsed: false })).toEqual({
      name: PLACE_SEO_FIELDSET_NAME,
      title: "SEO",
      collapsible: true,
      collapsed: false,
    });
  });
});

describe("resolvePlaceSeoFieldOptions", () => {
  it("defaults faqRequired to false and variant to place", () => {
    expect(resolvePlaceSeoFieldOptions()).toEqual({
      faqRequired: false,
      variant: "place",
    });
  });

  it("defaults faqRequired to false when options omit it", () => {
    expect(resolvePlaceSeoFieldOptions({ variant: "tour" })).toEqual({
      faqRequired: false,
      variant: "tour",
    });
  });

  it("preserves faqRequired true for tour documents", () => {
    expect(
      resolvePlaceSeoFieldOptions({ faqRequired: true, variant: "tour" }),
    ).toEqual({
      faqRequired: true,
      variant: "tour",
    });
  });
});

describe("PLACE_SEO_FAQ_MIN_WHEN_REQUIRED", () => {
  it("is 2 to match tour SEO FAQ validation", () => {
    expect(PLACE_SEO_FAQ_MIN_WHEN_REQUIRED).toBe(2);
  });
});

describe("validateOptionalNonBlankString", () => {
  it("accepts null and undefined (field left empty)", () => {
    expect(validateOptionalNonBlankString(null, "blank")).toBe(true);
    expect(validateOptionalNonBlankString(undefined, "blank")).toBe(true);
  });

  it("accepts non-blank strings", () => {
    expect(validateOptionalNonBlankString("Hello", "blank")).toBe(true);
  });

  it("rejects blank strings with the provided message", () => {
    expect(validateOptionalNonBlankString("", "Leave empty or enter text")).toBe(
      "Leave empty or enter text",
    );
    expect(
      validateOptionalNonBlankString("   ", "Leave empty or enter text"),
    ).toBe("Leave empty or enter text");
  });
});

describe("getPlaceSeoCopy", () => {
  it("returns place-oriented copy for city/country/region", () => {
    const copy = getPlaceSeoCopy("place");
    expect(copy.aiSummary).toMatch(/place/i);
    expect(copy.faq).toMatch(/place/i);
    expect(copy.sameAsUrl).toMatch(/place|entity/i);
    expect(copy.sameAsUrl).not.toMatch(/tour-specific/i);
  });

  it("returns tour-oriented copy for tour SEO documents", () => {
    const copy = getPlaceSeoCopy("tour");
    expect(copy.aiSummary).toMatch(/tour/i);
    expect(copy.faq).toMatch(/tour/i);
    expect(copy.sameAsUrl).toMatch(/tour/i);
  });
});
