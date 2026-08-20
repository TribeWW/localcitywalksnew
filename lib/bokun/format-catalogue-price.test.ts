import { describe, expect, it } from "vitest";
import { formatCataloguePriceAmount } from "@/lib/bokun/format-catalogue-price";

describe("formatCataloguePriceAmount", () => {
  it("formats a positive EUR amount with two decimal places", () => {
    expect(formatCataloguePriceAmount(124, "EUR")).toBe("€124.00");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(formatCataloguePriceAmount(124.5, "EUR")).toBe("€124.50");
  });

  it("formats whole amounts when fractionDigits is 0", () => {
    expect(formatCataloguePriceAmount(124, "EUR", { fractionDigits: 0 })).toBe(
      "€124",
    );
  });

  it("rounds fractional amounts when fractionDigits is 0 (listing cards)", () => {
    expect(formatCataloguePriceAmount(124.5, "EUR", { fractionDigits: 0 })).toBe(
      "€125",
    );
    expect(formatCataloguePriceAmount(124.4, "EUR", { fractionDigits: 0 })).toBe(
      "€124",
    );
  });

  it("formats with the maximum allowed fractionDigits of 20", () => {
    expect(formatCataloguePriceAmount(124, "EUR", { fractionDigits: 20 })).toBe(
      "€124.00000000000000000000",
    );
  });

  it("returns null for invalid fractionDigits values", () => {
    expect(
      formatCataloguePriceAmount(124, "EUR", { fractionDigits: -1 }),
    ).toBeNull();
    expect(
      formatCataloguePriceAmount(124, "EUR", { fractionDigits: 1.5 }),
    ).toBeNull();
    expect(
      formatCataloguePriceAmount(124, "EUR", { fractionDigits: 21 }),
    ).toBeNull();
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
