/**
 * site — unit tests for canonical site URL helpers.
 */

import { describe, expect, it } from "vitest";
import { SITE_URL, absoluteUrl, tourPageUrl } from "@/lib/site";

describe("SITE_URL", () => {
  it("is the production www origin without a trailing slash", () => {
    expect(SITE_URL).toBe("https://www.localcitywalks.com");
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("absoluteUrl", () => {
  it("joins a leading-slash path to the site origin", () => {
    expect(absoluteUrl("/explore")).toBe(
      "https://www.localcitywalks.com/explore",
    );
  });

  it("adds a leading slash when the path omits one", () => {
    expect(absoluteUrl("explore")).toBe(
      "https://www.localcitywalks.com/explore",
    );
  });

  it("returns the site origin for an empty path", () => {
    expect(absoluteUrl("")).toBe("https://www.localcitywalks.com");
    expect(absoluteUrl("/")).toBe("https://www.localcitywalks.com/");
  });

  it("preserves nested path segments", () => {
    expect(absoluteUrl("/tours/toledo/hello-toledo-1077682")).toBe(
      "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682",
    );
  });

  it("trims whitespace from the path before joining", () => {
    expect(absoluteUrl("  /explore  ")).toBe(
      "https://www.localcitywalks.com/explore",
    );
  });
});

describe("tourPageUrl", () => {
  it("builds the canonical tour detail URL from city and tour slugs", () => {
    expect(
      tourPageUrl("arles", "hello-arles-private-walk-9751538"),
    ).toBe(
      "https://www.localcitywalks.com/tours/arles/hello-arles-private-walk-9751538",
    );
  });

  it("trims whitespace from slug segments", () => {
    expect(tourPageUrl("  toledo  ", "  hello-toledo-1077682  ")).toBe(
      "https://www.localcitywalks.com/tours/toledo/hello-toledo-1077682",
    );
  });
});
