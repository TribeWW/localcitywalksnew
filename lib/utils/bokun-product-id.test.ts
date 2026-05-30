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

  it("returns null for null and undefined", () => {
    expect(toBokunProductIdDigits(null)).toBeNull();
    expect(toBokunProductIdDigits(undefined)).toBeNull();
  });

  it("returns null for empty or non-digit strings", () => {
    expect(toBokunProductIdDigits("")).toBeNull();
    expect(toBokunProductIdDigits("abc")).toBeNull();
  });
});

describe("normalizeBokunProductIds", () => {
  it("dedupes mixed string and numeric ids", () => {
    expect(normalizeBokunProductIds(["101", 101, 202], 50)).toEqual([
      "101",
      "202",
    ]);
  });

  it("returns an empty array when maxIds is zero or negative", () => {
    expect(normalizeBokunProductIds(["101", 202], 0)).toEqual([]);
    expect(normalizeBokunProductIds(["101", 202], -1)).toEqual([]);
  });

  it("filters null, undefined, empty, and non-digit values", () => {
    expect(
      normalizeBokunProductIds([null, undefined, "", "abc", "303"], 50),
    ).toEqual(["303"]);
  });

  it("dedupes repeated normalized ids", () => {
    expect(
      normalizeBokunProductIds(["101", 101, "tour-101", "101"], 50),
    ).toEqual(["101"]);
  });

  it("stops once maxIds normalized ids are collected", () => {
    expect(normalizeBokunProductIds(["101", "202", "303"], 2)).toEqual([
      "101",
      "202",
    ]);
  });
});
