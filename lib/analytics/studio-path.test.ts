import { describe, expect, it } from "vitest";

import { isSanityStudioPath, pathnameFromUrl } from "./studio-path";

describe("isSanityStudioPath", () => {
  it("matches /studio and nested Studio paths", () => {
    expect(isSanityStudioPath("/studio")).toBe(true);
    expect(isSanityStudioPath("/studio/")).toBe(true);
    expect(isSanityStudioPath("/studio/structure")).toBe(true);
  });

  it("does not match public site paths", () => {
    expect(isSanityStudioPath("/")).toBe(false);
    expect(isSanityStudioPath("/tours")).toBe(false);
    expect(isSanityStudioPath("/studio-guide")).toBe(false);
  });
});

describe("pathnameFromUrl", () => {
  it("reads the pathname from absolute and relative URLs", () => {
    expect(pathnameFromUrl("https://example.com/studio/structure")).toBe(
      "/studio/structure",
    );
    expect(pathnameFromUrl("/studio?tool=vision", "https://example.com")).toBe(
      "/studio",
    );
  });

  it("keeps the current pathname for query-only and fragment-only targets", () => {
    expect(
      pathnameFromUrl("?internal=off", "https://example.com/tours/paris"),
    ).toBe("/tours/paris");
    expect(pathnameFromUrl("#panel", "https://example.com/studio")).toBe(
      "/studio",
    );
  });
});
