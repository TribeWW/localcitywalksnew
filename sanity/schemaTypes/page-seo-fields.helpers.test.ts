/**
 * page-seo-fields.helpers — unit tests for shared page SEO field helpers.
 */

import { describe, expect, it } from "vitest";
import {
  PAGE_SEO_FIELDSET_NAME,
  resolvePageSeoFieldsetOptions,
  validateOptionalNonBlankString,
} from "./page-seo-fields.helpers";

describe("resolvePageSeoFieldsetOptions", () => {
  it("defaults to a collapsible SEO group that starts expanded", () => {
    expect(resolvePageSeoFieldsetOptions()).toEqual({
      name: PAGE_SEO_FIELDSET_NAME,
      title: "SEO",
      collapsible: true,
      collapsed: false,
    });
  });

  it("allows starting collapsed", () => {
    expect(resolvePageSeoFieldsetOptions({ collapsed: true })).toEqual({
      name: PAGE_SEO_FIELDSET_NAME,
      title: "SEO",
      collapsible: true,
      collapsed: true,
    });
  });
});

describe("validateOptionalNonBlankString", () => {
  it("re-exports the shared optional-string helper", () => {
    expect(validateOptionalNonBlankString(undefined, "blank")).toBe(true);
    expect(validateOptionalNonBlankString("", "blank")).toBe("blank");
  });
});
