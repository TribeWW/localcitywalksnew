/**
 * guest-categories — red/green TDD specs (LOC-1063).
 */

import { describe, expect, it } from "vitest";
import {
  formatGuestUnitHint,
  GUEST_CATEGORIES,
} from "@/components/tours/booking-widget/guest-categories";
import type { BookingWidgetQuote } from "@/types/bokun";

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1,
      categoryLabel: "Adult",
      count: 1,
      unitAmount: 248,
      lineTotal: 248,
      currency: "EUR",
    },
    {
      categoryId: 2,
      categoryLabel: "Infant",
      count: 1,
      unitAmount: 0,
      lineTotal: 0,
      currency: "EUR",
    },
  ],
};

describe("GUEST_CATEGORIES", () => {
  it("defines four participant categories in widget order", () => {
    expect(GUEST_CATEGORIES.map((c) => c.key)).toEqual([
      "adults",
      "youth",
      "children",
      "infants",
    ]);
  });
});

describe("formatGuestUnitHint", () => {
  it("returns em dash when quote is null", () => {
    expect(formatGuestUnitHint("Adults", null)).toBe("—");
  });

  it("returns Free for zero unit amount", () => {
    expect(formatGuestUnitHint("Infant", sampleQuote)).toBe("Free");
  });

  it("returns formatted price for matching Bókun breakdown label", () => {
    expect(formatGuestUnitHint("Adult", sampleQuote)).toBe("€248");
  });

  it("matches widget plural labels to singular breakdown labels", () => {
    expect(formatGuestUnitHint("Adults", sampleQuote)).toBe("€248");
    expect(formatGuestUnitHint("Infants", sampleQuote)).toBe("Free");
  });

  it("matches category labels case-insensitively", () => {
    expect(formatGuestUnitHint("adult", sampleQuote)).toBe("€248");
  });
});
