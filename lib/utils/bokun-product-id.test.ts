import { describe, expect, it } from "vitest";
import {
  normalizeBokunProductIds,
  toBokunProductIdDigits,
} from "@/lib/utils/bokun-product-id";

describe("toBokunProductIdDigits", () => {
  it("coerces numeric ids to digit strings", () => {
    expect(toBokunProductIdDigits(1077682)).toBe("1077682");
  });

  it("strips non-digit characters from string ids", () => {
    expect(toBokunProductIdDigits("tour-42")).toBe("42");
  });
});

describe("normalizeBokunProductIds", () => {
  it("dedupes mixed string and numeric ids", () => {
    expect(normalizeBokunProductIds(["101", 101, 202], 50)).toEqual([
      "101",
      "202",
    ]);
  });
});
