/**
 * build-tour-booking-submit-payload — red/green TDD specs (LOC-1056).
 */

import { describe, expect, it } from "vitest";
import { buildTourBookingSubmitPayload } from "@/lib/actions/build-tour-booking-submit-payload";
import type { BookingWidgetQuote } from "@/types/bokun";

const quote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const formValues = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phoneNumber: "+34123456789",
  message: "Slow pace please.",
  city: "Biarritz",
  adults: 1,
  youth: 0,
  children: 0,
  infants: 0,
  preferredDate: new Date(2026, 5, 15),
  startTimeId: "4252139",
  language: "EN_GB",
  consent: true,
};

describe("buildTourBookingSubmitPayload", () => {
  it("maps form values, bootstrap ids, and live quote to submit input", () => {
    const payload = buildTourBookingSubmitPayload({
      values: formValues,
      productId: "1079932",
      productTitle: "Hello Biarritz",
      quote,
    });

    expect(payload).toMatchObject({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phoneNumber: "+34123456789",
      message: "Slow pace please.",
      city: "Biarritz",
      productId: "1079932",
      productTitle: "Hello Biarritz",
      date: "2026-06-15",
      startTimeId: 4252139,
      language: "EN_GB",
      consent: true,
      participants: { adults: 1, youth: 0, children: 0, infants: 0 },
      clientQuote: { totalAmount: 248, currency: "EUR" },
    });
  });

  it("omits blank optional message", () => {
    const payload = buildTourBookingSubmitPayload({
      values: { ...formValues, message: "   " },
      productId: "1079932",
      productTitle: "Hello Biarritz",
      quote,
    });

    expect(payload.message).toBeUndefined();
  });

  it("throws when preferred date is missing", () => {
    expect(() =>
      buildTourBookingSubmitPayload({
        values: { ...formValues, preferredDate: undefined },
        productId: "1079932",
        productTitle: "Hello Biarritz",
        quote,
      }),
    ).toThrow("Missing tour date");
  });

  it("throws when start time is missing", () => {
    expect(() =>
      buildTourBookingSubmitPayload({
        values: { ...formValues, startTimeId: undefined },
        productId: "1079932",
        productTitle: "Hello Biarritz",
        quote,
      }),
    ).toThrow("Missing start time");
  });
});
