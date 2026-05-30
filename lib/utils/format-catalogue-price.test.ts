import { describe, expect, it } from "vitest";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

describe("formatCataloguePriceAmount", () => {
  it("formats a positive EUR amount for display", () => {
    expect(formatCataloguePriceAmount(124, "EUR")).toBe("€124");
  });

  it("returns null for non-finite amounts", () => {
    expect(formatCataloguePriceAmount(Number.NaN, "EUR")).toBeNull();
    expect(formatCataloguePriceAmount(Number.POSITIVE_INFINITY, "EUR")).toBeNull();
  });

  it("returns null for negative amounts", () => {
    expect(formatCataloguePriceAmount(-1, "EUR")).toBeNull();
  });

  it("returns null when currency is missing", () => {
    expect(formatCataloguePriceAmount(120, "")).toBeNull();
    expect(formatCataloguePriceAmount(120, "   ")).toBeNull();
  });
});
