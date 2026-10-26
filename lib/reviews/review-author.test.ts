import { describe, expect, it } from "vitest";
import { formatPublicReviewAuthorName } from "./review-author";

describe("formatPublicReviewAuthorName", () => {
  it("shows the given name and the family initial", () => {
    expect(formatPublicReviewAuthorName("Jane Doe")).toBe("Jane D.");
  });

  it("uses the first given name and the last family initial", () => {
    expect(formatPublicReviewAuthorName("Mary Ann Smith")).toBe("Mary S.");
  });

  it("keeps a single name", () => {
    expect(formatPublicReviewAuthorName("  Madonna  ")).toBe("Madonna");
  });

  it("uses a dash when the name is blank", () => {
    expect(formatPublicReviewAuthorName("   ")).toBe("—");
  });
});
