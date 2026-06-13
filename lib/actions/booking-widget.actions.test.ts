/**
 * booking-widget server actions — red/green TDD specs (LOC-1047).
 *
 * Critical invariants:
 * - Invalid ids / dates never reach Bókun (fetch or detail)
 * - Quote availabilities use a single-day window (`start === end === date`)
 * - `pricingCategories` and `defaultRateId` flow from product detail into calculate
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BokunAvailability, BookingWidgetQuote } from "@/types/bokun";

const fetchAvailabilitiesMock = vi.fn();
const getTourDetailByIdMock = vi.fn();
const calculateBookingQuoteMock = vi.fn();

vi.mock("@/lib/bokun/fetch-availabilities", () => ({
  fetchAvailabilities: (...args: unknown[]) => fetchAvailabilitiesMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

vi.mock("@/lib/bokun/calculate-booking-quote", () => ({
  calculateBookingQuote: (...args: unknown[]) =>
    calculateBookingQuoteMock(...args),
}));

import {
  computeTourBookingQuote,
  getTourAvailabilities,
  getTourBookingQuote,
} from "@/lib/actions/booking-widget.actions";

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

const sampleAvailability: BokunAvailability = {
  id: "4252139_20260612",
  activityId: 1079932,
  startTimeId: 4252139,
  date: Date.parse(`${futureIsoDate()}T12:00:00.000Z`),
  pricesByRate: [],
  guidedLanguages: [],
  soldOut: false,
};

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const pricingCategories = [
  { id: 1045649, title: "Adult", ticketCategory: "ADULT" },
  { id: 1045650, title: "Youth", ticketCategory: "TEENAGER" },
];

const validQuoteInput = {
  productId: "1079932",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
};

function stubSuccessfulQuotePipeline() {
  getTourDetailByIdMock.mockResolvedValue({
    success: true,
    data: {
      id: "1079932",
      title: "Hello Biarritz",
      defaultRateId: 2199582,
      pricingCategories,
      keyPhoto: { derived: [] },
    },
  });
  fetchAvailabilitiesMock.mockResolvedValue({
    success: true,
    data: [sampleAvailability],
  });
  calculateBookingQuoteMock.mockReturnValue(sampleQuote);
}

describe("getTourAvailabilities — validation gates", () => {
  beforeEach(() => {
    fetchAvailabilitiesMock.mockReset();
    fetchAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [sampleAvailability],
    });
  });

  it("returns availability rows from fetchAvailabilities", async () => {
    const start = futureIsoDate();
    const end = futureIsoDate(14);

    const result = await getTourAvailabilities("1079932", start, end);

    expect(result).toEqual({ success: true, data: [sampleAvailability] });
    expect(fetchAvailabilitiesMock).toHaveBeenCalledWith("1079932", {
      start,
      end,
      currency: "EUR",
    });
  });

  it("security invariant: rejects invalid product id before fetch", async () => {
    const result = await getTourAvailabilities(
      "../1079932",
      futureIsoDate(),
      futureIsoDate(),
    );

    expect(result).toEqual({ success: false, error: "Invalid product id" });
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
  });

  it("rejects invalid date range format", async () => {
    const result = await getTourAvailabilities(
      "1079932",
      "not-a-date",
      futureIsoDate(),
    );

    expect(result).toEqual({ success: false, error: "Invalid date range" });
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
  });

  it("rejects start after end", async () => {
    const result = await getTourAvailabilities(
      "1079932",
      futureIsoDate(14),
      futureIsoDate(7),
    );

    expect(result).toEqual({ success: false, error: "Invalid date range" });
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
  });

  it("surfaces fetch failures without exposing Bókun internals", async () => {
    fetchAvailabilitiesMock.mockResolvedValue({
      success: false,
      error: "Unable to load availabilities",
    });

    const result = await getTourAvailabilities(
      "1079932",
      futureIsoDate(),
      futureIsoDate(),
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to load availabilities",
    });
  });

  it("forwards custom currency to fetchAvailabilities", async () => {
    await getTourAvailabilities(
      "1079932",
      futureIsoDate(),
      futureIsoDate(7),
      "USD",
    );

    expect(fetchAvailabilitiesMock).toHaveBeenCalledWith(
      "1079932",
      expect.objectContaining({ currency: "USD" }),
    );
  });
});

describe("getTourBookingQuote — validation gates", () => {
  beforeEach(() => {
    fetchAvailabilitiesMock.mockReset();
    getTourDetailByIdMock.mockReset();
    calculateBookingQuoteMock.mockReset();
    stubSuccessfulQuotePipeline();
  });

  it("security invariant: validates input before any Bókun call", async () => {
    const result = await getTourBookingQuote({
      ...validQuoteInput,
      productId: "",
    });

    expect(result.success).toBe(false);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("rejects past dates before Bókun calls", async () => {
    const result = await getTourBookingQuote({
      ...validQuoteInput,
      date: pastIsoDate(),
    });

    expect(result.success).toBe(false);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
  });
});

describe("computeTourBookingQuote — pipeline invariants", () => {
  beforeEach(() => {
    fetchAvailabilitiesMock.mockReset();
    getTourDetailByIdMock.mockReset();
    calculateBookingQuoteMock.mockReset();
    stubSuccessfulQuotePipeline();
  });

  it("returns a quote when detail, availabilities, and calculate succeed", async () => {
    const result = await computeTourBookingQuote(validQuoteInput);

    expect(result).toEqual({ success: true, data: sampleQuote });
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("1079932");
    expect(fetchAvailabilitiesMock).toHaveBeenCalledWith("1079932", {
      start: validQuoteInput.date,
      end: validQuoteInput.date,
      currency: "EUR",
    });
    expect(calculateBookingQuoteMock).toHaveBeenCalledWith(
      [sampleAvailability],
      validQuoteInput.date,
      validQuoteInput.startTimeId,
      validQuoteInput.participants,
      2199582,
      { pricingCategories },
    );
  });

  it("pipeline invariant: quote fetch uses single-day window (start === end)", async () => {
    await computeTourBookingQuote({
      ...validQuoteInput,
      date: "2026-09-01",
    });

    expect(fetchAvailabilitiesMock).toHaveBeenCalledWith("1079932", {
      start: "2026-09-01",
      end: "2026-09-01",
      currency: "EUR",
    });
  });

  it("pipeline invariant: passes product defaultRateId into calculate", async () => {
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "1079932",
        title: "Hello Biarritz",
        defaultRateId: 9999999,
        pricingCategories,
        keyPhoto: { derived: [] },
      },
    });

    await computeTourBookingQuote(validQuoteInput);

    expect(calculateBookingQuoteMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(String),
      expect.any(Number),
      expect.any(Object),
      9999999,
      expect.any(Object),
    );
  });

  it("pipeline invariant: forwards custom currency to availabilities fetch", async () => {
    await computeTourBookingQuote({
      ...validQuoteInput,
      currency: "USD",
    });

    expect(fetchAvailabilitiesMock).toHaveBeenCalledWith(
      "1079932",
      expect.objectContaining({ currency: "USD" }),
    );
  });

  it("returns error when product detail fetch fails", async () => {
    getTourDetailByIdMock.mockResolvedValue({
      success: false,
      error: "Tour not found",
    });

    const result = await computeTourBookingQuote(validQuoteInput);

    expect(result).toEqual({ success: false, error: "Tour not found" });
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("returns error when product detail lacks defaultRateId", async () => {
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "1079932",
        title: "Hello Biarritz",
        keyPhoto: { derived: [] },
      },
    });

    const result = await computeTourBookingQuote(validQuoteInput);

    expect(result).toEqual({
      success: false,
      error: "Unable to calculate quote",
    });
    expect(fetchAvailabilitiesMock).not.toHaveBeenCalled();
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("returns error when availabilities fetch fails before calculate", async () => {
    fetchAvailabilitiesMock.mockResolvedValue({
      success: false,
      error: "Unable to load availabilities",
    });

    const result = await computeTourBookingQuote(validQuoteInput);

    expect(result).toEqual({
      success: false,
      error: "Unable to load availabilities",
    });
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("returns error when calculateBookingQuote returns null", async () => {
    calculateBookingQuoteMock.mockReturnValue(null);

    const result = await computeTourBookingQuote(validQuoteInput);

    expect(result).toEqual({
      success: false,
      error: "Unable to calculate quote for this selection",
    });
  });
});

describe("getTourBookingQuote — delegates to computeTourBookingQuote", () => {
  beforeEach(() => {
    stubSuccessfulQuotePipeline();
  });

  it("returns the same quote as the compute pipeline", async () => {
    const result = await getTourBookingQuote(validQuoteInput);

    expect(result).toEqual({ success: true, data: sampleQuote });
  });
});
