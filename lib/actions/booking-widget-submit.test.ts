/**
 * booking-widget submit helpers — red/green TDD specs (LOC-1056).
 */

import { describe, expect, it } from "vitest";
import {
  BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
  clientQuoteMatchesServer,
  formatBokunStartTimeLabel,
  resolveStartTimeLabel,
  submitInputToQuoteInput,
} from "@/lib/actions/booking-widget-submit";
import type { TourBookingSubmitInput } from "@/lib/validation/tour-booking";
import type { BookingWidgetQuote } from "@/types/bokun";

const serverQuote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const submitBase: TourBookingSubmitInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  city: "Biarritz",
  productId: "1079932",
  productTitle: "Hello Biarritz",
  date: "2026-06-15",
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  clientQuote: { totalAmount: 248, currency: "EUR" },
  consent: true,
};

describe("clientQuoteMatchesServer", () => {
  it("returns true when total and currency match", () => {
    expect(
      clientQuoteMatchesServer(
        { totalAmount: 248, currency: "EUR" },
        serverQuote,
      ),
    ).toBe(true);
  });

  it("returns false when total amount differs", () => {
    expect(
      clientQuoteMatchesServer(
        { totalAmount: 999, currency: "EUR" },
        serverQuote,
      ),
    ).toBe(false);
  });

  it("returns false when currency differs", () => {
    expect(
      clientQuoteMatchesServer(
        { totalAmount: 248, currency: "USD" },
        serverQuote,
      ),
    ).toBe(false);
  });
});

describe("resolveStartTimeLabel", () => {
  it("formats matching start time as HH:mm", () => {
    expect(
      resolveStartTimeLabel([{ id: 4252139, hour: 11, minute: 0 }], 4252139),
    ).toBe("11:00");
  });

  it("falls back when start time id is unknown", () => {
    expect(resolveStartTimeLabel([], 4252139)).toBe("Start time 4252139");
  });
});

describe("formatBokunStartTimeLabel", () => {
  it("zero-pads hour and minute", () => {
    expect(formatBokunStartTimeLabel({ id: 1, hour: 9, minute: 5 })).toBe(
      "09:05",
    );
  });
});

describe("submitInputToQuoteInput", () => {
  it("maps submit fields to quote input using client currency", () => {
    expect(submitInputToQuoteInput(submitBase)).toEqual({
      productId: "1079932",
      date: "2026-06-15",
      startTimeId: 4252139,
      participants: { adults: 1, youth: 0, children: 0, infants: 0 },
      language: undefined,
      currency: "EUR",
    });
  });
});

describe("BOOKING_WIDGET_PRICE_MISMATCH_ERROR", () => {
  it("exposes user-facing mismatch copy", () => {
    expect(BOOKING_WIDGET_PRICE_MISMATCH_ERROR).toContain("Price has changed");
  });
});
