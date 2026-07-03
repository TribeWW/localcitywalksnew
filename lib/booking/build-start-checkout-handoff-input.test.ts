/**
 * buildStartCheckoutHandoffInput — red/green TDD specs (LOC-1157).
 */

import { describe, expect, it } from "vitest";
import { buildStartCheckoutHandoffInput } from "@/lib/booking/build-start-checkout-handoff-input";
import type { BookingWidgetQuote } from "@/types/bokun";

const quote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const baseValues = {
  preferredDate: new Date(2026, 5, 15),
  startTimeId: "4252139",
  language: "en",
  adults: 1,
  youth: 0,
  children: 0,
  infants: 0,
};

describe("buildStartCheckoutHandoffInput", () => {
  it("maps step-1 widget selection and live quote to handoff input", () => {
    expect(
      buildStartCheckoutHandoffInput({
        values: baseValues,
        productId: "1079932",
        productTitle: "Hello Biarritz",
        quote,
      }),
    ).toEqual({
      productId: "1079932",
      productTitle: "Hello Biarritz",
      date: "2026-06-15",
      startTimeId: 4252139,
      language: "en",
      participants: { adults: 1, youth: 0, children: 0, infants: 0 },
      clientQuote: { totalAmount: 248, currency: "EUR" },
    });
  });

  it("throws when date or start time is missing", () => {
    expect(() =>
      buildStartCheckoutHandoffInput({
        values: { ...baseValues, preferredDate: undefined },
        productId: "1079932",
        productTitle: "Hello Biarritz",
        quote,
      }),
    ).toThrow("Missing tour date");
  });
});
