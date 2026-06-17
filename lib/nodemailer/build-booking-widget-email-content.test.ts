/**
 * build-booking-widget-email-content — red/green TDD specs (LOC-1055).
 *
 * Critical invariants:
 * - Maps validated submit input + server quote into `BookingWidgetEmailContent`
 * - Uses server quote totals/breakdown, never `clientQuote`
 * - Flattens nested `participants` onto email payload
 */

import { describe, expect, it } from "vitest";
import { buildBookingWidgetEmailContent } from "@/lib/nodemailer/build-booking-widget-email-content";
import type { TourBookingSubmitInput } from "@/lib/validation/tour-booking";
import type { BookingWidgetQuote } from "@/types/bokun";

const submitBase: TourBookingSubmitInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phoneNumber: "+34123456789",
  message: "Slow pace please.",
  city: "Toledo",
  productId: "1079932",
  productTitle: "Hello Toledo Private Walk",
  date: "2026-07-15",
  startTimeId: 12345,
  language: "EN_GB",
  participants: {
    adults: 2,
    youth: 0,
    children: 1,
    infants: 1,
  },
  clientQuote: { totalAmount: 999, currency: "EUR" },
  consent: true,
};

const verifiedQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1,
      categoryLabel: "Adult",
      count: 2,
      unitAmount: 124,
      lineTotal: 248,
      currency: "EUR",
    },
  ],
};

describe("buildBookingWidgetEmailContent — mapping invariants", () => {
  it("quote invariant: uses server quote total and breakdown, not clientQuote", () => {
    const content = buildBookingWidgetEmailContent({
      submit: submitBase,
      quote: verifiedQuote,
      startTimeLabel: "11:00",
      durationText: "2 hours",
      productTitle: "Hello Toledo Private Walk",
    });

    expect(content.totalAmount).toBe(448);
    expect(content.currency).toBe("EUR");
    expect(content.breakdown).toEqual([
      {
        categoryLabel: "Adult",
        count: 2,
        lineTotal: 248,
        currency: "EUR",
      },
    ]);
    expect(content.totalAmount).not.toBe(submitBase.clientQuote.totalAmount);
  });

  it("participants invariant: flattens nested submit participants", () => {
    const content = buildBookingWidgetEmailContent({
      submit: submitBase,
      quote: verifiedQuote,
      startTimeLabel: "11:00",
      productTitle: "Hello Toledo Private Walk",
    });

    expect(content.adults).toBe(2);
    expect(content.children).toBe(1);
    expect(content.infants).toBe(1);
    expect(content.youth).toBe(0);
  });

  it("slot invariant: carries date, startTimeId, label, and language", () => {
    const content = buildBookingWidgetEmailContent({
      submit: submitBase,
      quote: verifiedQuote,
      startTimeLabel: "11:00",
      productTitle: "Hello Toledo Private Walk",
    });

    expect(content.date).toBe("2026-07-15");
    expect(content.startTimeId).toBe(12345);
    expect(content.startTimeLabel).toBe("11:00");
    expect(content.language).toBe("EN_GB");
  });

  it("product invariant: prefers explicit productTitle argument over submit field", () => {
    const content = buildBookingWidgetEmailContent({
      submit: { ...submitBase, productTitle: "Stale title" },
      quote: verifiedQuote,
      startTimeLabel: "11:00",
      productTitle: "Resolved title from detail",
    });

    expect(content.productTitle).toBe("Resolved title from detail");
    expect(content.productId).toBe("1079932");
    expect(content.city).toBe("Toledo");
  });

  it("contact invariant: copies contact fields and consent", () => {
    const content = buildBookingWidgetEmailContent({
      submit: submitBase,
      quote: verifiedQuote,
      startTimeLabel: "11:00",
      productTitle: "Hello Toledo Private Walk",
    });

    expect(content.fullName).toBe("Jane Doe");
    expect(content.email).toBe("jane@example.com");
    expect(content.phoneNumber).toBe("+34123456789");
    expect(content.message).toBe("Slow pace please.");
    expect(content.consent).toBe(true);
  });
});
