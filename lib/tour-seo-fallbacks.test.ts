/**
 * tour-seo-fallbacks — unit tests for city-templated Tour SEO fallback copy.
 */

import { describe, expect, it } from "vitest";
import { buildTourSeoFallbacks } from "@/lib/tour-seo-fallbacks";

describe("buildTourSeoFallbacks", () => {
  it("interpolates city name into title, description, and lowercase keyword", () => {
    expect(buildTourSeoFallbacks("Toledo")).toEqual({
      seoTitle: "Toledo Private Walking Tour | LocalCityWalks",
      metaDescription:
        "Discover Toledo with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.",
      focusKeyword: "toledo private walking tour",
    });
  });

  it("trims whitespace from the city name before interpolation", () => {
    expect(buildTourSeoFallbacks("  Toledo  ").focusKeyword).toBe(
      "toledo private walking tour",
    );
  });

  it("uses graceful copy when city name is missing", () => {
    expect(buildTourSeoFallbacks(null)).toEqual({
      seoTitle: "Private Walking Tour | LocalCityWalks",
      metaDescription:
        "Discover this city with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.",
      focusKeyword: "private walking tour",
    });
    expect(buildTourSeoFallbacks("")).toEqual({
      seoTitle: "Private Walking Tour | LocalCityWalks",
      metaDescription:
        "Discover this city with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.",
      focusKeyword: "private walking tour",
    });
  });
});
