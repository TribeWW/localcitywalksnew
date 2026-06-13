/**
 * tour-booking Zod schemas — validation specs (LOC-1046).
 *
 * Covers quote/submit acceptance and rejection paths: product id, dates,
 * startTimeId, participants, client quote tampering, and consent.
 */

import { describe, expect, it, vi } from "vitest";
import {
  parseTourBookingQuoteInput,
  parseTourBookingSubmitInput,
  tourBookingQuoteInputSchema,
  tourBookingSubmitSchema,
} from "@/lib/validation/tour-booking";

function futureIsoDate(daysAhead = 7): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function pastIsoDate(daysAgo = 1): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

const validParticipants = {
  adults: 1,
  youth: 0,
  children: 0,
  infants: 0,
};

const validQuoteInput = {
  productId: "1079932",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: validParticipants,
};

const validSubmitInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  city: "Biarritz",
  productId: "1079932",
  productTitle: "Hello Biarritz",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: validParticipants,
  clientQuote: { totalAmount: 248, currency: "EUR" },
  consent: true,
};

describe("tourBookingQuoteInputSchema", () => {
  it("accepts a valid quote request", () => {
    expect(tourBookingQuoteInputSchema.safeParse(validQuoteInput).success).toBe(
      true,
    );
  });

  it("rejects invalid product id", () => {
    const result = tourBookingQuoteInputSchema.safeParse({
      ...validQuoteInput,
      productId: "../1079932",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Invalid product id");
  });

  it("rejects past dates", () => {
    const result = tourBookingQuoteInputSchema.safeParse({
      ...validQuoteInput,
      date: pastIsoDate(),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Please select a future date for your tour",
    );
  });

  it("rejects non-positive startTimeId", () => {
    expect(
      tourBookingQuoteInputSchema.safeParse({
        ...validQuoteInput,
        startTimeId: 0,
      }).success,
    ).toBe(false);

    expect(
      tourBookingQuoteInputSchema.safeParse({
        ...validQuoteInput,
        startTimeId: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects zero participants across all categories", () => {
    const result = tourBookingQuoteInputSchema.safeParse({
      ...validQuoteInput,
      participants: { adults: 0, youth: 0, children: 0, infants: 0 },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Please select at least one participant for the tour",
    );
  });

  it("accepts infants as the only non-zero participant category", () => {
    expect(
      tourBookingQuoteInputSchema.safeParse({
        ...validQuoteInput,
        participants: { adults: 0, youth: 0, children: 0, infants: 1 },
      }).success,
    ).toBe(true);
  });
});

describe("tourBookingSubmitSchema", () => {
  it("accepts a valid submit payload", () => {
    expect(tourBookingSubmitSchema.safeParse(validSubmitInput).success).toBe(
      true,
    );
  });

  it("rejects tampered negative totalAmount", () => {
    const result = tourBookingSubmitSchema.safeParse({
      ...validSubmitInput,
      clientQuote: { totalAmount: -1, currency: "EUR" },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Invalid total price");
  });

  it("rejects tampered non-ISO currency", () => {
    const result = tourBookingSubmitSchema.safeParse({
      ...validSubmitInput,
      clientQuote: { totalAmount: 248, currency: "euro" },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Invalid currency");
  });

  it("rejects NaN and Infinity totals", () => {
    expect(
      tourBookingSubmitSchema.safeParse({
        ...validSubmitInput,
        clientQuote: { totalAmount: Number.NaN, currency: "EUR" },
      }).success,
    ).toBe(false);

    expect(
      tourBookingSubmitSchema.safeParse({
        ...validSubmitInput,
        clientQuote: { totalAmount: Number.POSITIVE_INFINITY, currency: "EUR" },
      }).success,
    ).toBe(false);
  });

  it("rejects submit without consent", () => {
    const result = tourBookingSubmitSchema.safeParse({
      ...validSubmitInput,
      consent: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "You must agree to the terms to submit the form",
    );
  });

  it("does not include tourDuration or preferredTime fields", () => {
    const parsed = tourBookingSubmitSchema.parse(validSubmitInput);

    expect(parsed).not.toHaveProperty("tourDuration");
    expect(parsed).not.toHaveProperty("preferredTime");
  });
});

describe("parseTourBookingQuoteInput", () => {
  it("returns parsed data on success", () => {
    expect(parseTourBookingQuoteInput(validQuoteInput)).toEqual({
      success: true,
      data: validQuoteInput,
    });
  });

  it("returns first validation error on failure", () => {
    expect(parseTourBookingQuoteInput({ ...validQuoteInput, productId: "" })).toEqual({
      success: false,
      error: "Invalid product id",
    });
  });
});

describe("parseTourBookingSubmitInput", () => {
  it("returns parsed data on success", () => {
    const result = parseTourBookingSubmitInput(validSubmitInput);
    expect(result.success).toBe(true);
  });

  it("rejects past booking dates on submit", () => {
    expect(
      parseTourBookingSubmitInput({
        ...validSubmitInput,
        date: pastIsoDate(),
      }),
    ).toEqual({
      success: false,
      error: "Please select a future date for your tour",
    });
  });
});

describe("future date boundary", () => {
  it("accepts today as a valid booking date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T15:00:00.000Z"));

    expect(
      tourBookingQuoteInputSchema.safeParse({
        ...validQuoteInput,
        date: "2026-06-12",
      }).success,
    ).toBe(true);

    vi.useRealTimers();
  });
});
