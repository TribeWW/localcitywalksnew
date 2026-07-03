/**
 * detectCheckoutPriceUpdate — red/green TDD specs (LOC-1156).
 */

import { describe, expect, it } from "vitest";
import {
  detectCheckoutPriceUpdate,
  resolveCheckoutPriceUpdatedBannerMessage,
} from "@/lib/checkout/checkout-price-update";
import type { BookingWidgetQuote } from "@/types/bokun";

const serverQuote: BookingWidgetQuote = {
  totalAmount: 496,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

describe("detectCheckoutPriceUpdate", () => {
  it("returns null when handoff clientQuote matches the server re-quote", () => {
    expect(
      detectCheckoutPriceUpdate(
        { totalAmount: 496, currency: "EUR" },
        serverQuote,
      ),
    ).toBeNull();
  });

  it("returns previous and current totals when the server price changed", () => {
    expect(
      detectCheckoutPriceUpdate(
        { totalAmount: 448, currency: "EUR" },
        serverQuote,
      ),
    ).toEqual({
      previousTotalAmount: 448,
      previousCurrency: "EUR",
      currentTotalAmount: 496,
      currentCurrency: "EUR",
    });
  });
});

describe("resolveCheckoutPriceUpdatedBannerMessage", () => {
  it("mentions the updated total for customer review", () => {
    const message = resolveCheckoutPriceUpdatedBannerMessage({
      previousTotalAmount: 448,
      previousCurrency: "EUR",
      currentTotalAmount: 496,
      currentCurrency: "EUR",
    });

    expect(message).toContain("€448");
    expect(message).toContain("€496");
    expect(message).toMatch(/updated|changed/i);
  });
});
