import { describe, expect, it } from "vitest";
import { normalizeFooterCityLinkRows } from "./footer-city-link-rows";

describe("normalizeFooterCityLinkRows", () => {
  it("returns empty array for null, undefined, or empty input", () => {
    expect(normalizeFooterCityLinkRows(null)).toEqual([]);
    expect(normalizeFooterCityLinkRows(undefined)).toEqual([]);
    expect(normalizeFooterCityLinkRows([])).toEqual([]);
  });

  it("keeps rows with non-empty name and /tours/ href", () => {
    expect(
      normalizeFooterCityLinkRows([
        { name: "  Paris  ", href: "  /tours/paris  " },
      ]),
    ).toEqual([{ name: "Paris", href: "/tours/paris" }]);
  });

  it("drops rows with empty name or href after trim", () => {
    expect(
      normalizeFooterCityLinkRows([
        { name: "   ", href: "/tours/x" },
        { name: "Y", href: "   " },
      ]),
    ).toEqual([]);
  });

  it("drops hrefs that do not start with /tours/", () => {
    expect(
      normalizeFooterCityLinkRows([
        { name: "Bad", href: "/other/paris" },
        { name: "Good", href: "/tours/paris" },
      ]),
    ).toEqual([{ name: "Good", href: "/tours/paris" }]);
  });
});
