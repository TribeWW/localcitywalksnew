/**
 * resizeBokunLightboxThumbnailUrl — lightbox thumbnail CDN rewrite.
 */

import { describe, expect, it } from "vitest";
import { resizeBokunLightboxThumbnailUrl } from "./resize-bokun-lightbox-thumbnail-url";

describe("resizeBokunLightboxThumbnailUrl", () => {
  it("sets w=160 and h=112 on imgcdn.bokun.tools addresses", () => {
    const input =
      "https://imgcdn.bokun.tools/example.jpg?w=660&h=660&mode=crop";
    const result = resizeBokunLightboxThumbnailUrl(input);
    const parsed = new URL(result);
    expect(parsed.searchParams.get("w")).toBe("160");
    expect(parsed.searchParams.get("h")).toBe("112");
  });

  it("leaves non CDN addresses unchanged", () => {
    const input = "https://example.com/photo.jpg";
    expect(resizeBokunLightboxThumbnailUrl(input)).toBe(input);
  });

  it("returns the original string when the URL cannot be parsed", () => {
    expect(resizeBokunLightboxThumbnailUrl("not a url")).toBe("not a url");
  });
});
