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

vi.mock("@/lib/bokun/calculate-booking-quote", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/bokun/calculate-booking-quote")>();
  return {
    ...actual,
    calculateBookingQuote: (...args: unknown[]) =>
      calculateBookingQuoteMock(...args),
  };
});

const sendBookingWidgetRequestEmailsMock = vi.fn();

vi.mock("@/lib/nodemailer", () => ({
  sendBookingWidgetRequestEmails: (...args: unknown[]) =>
    sendBookingWidgetRequestEmailsMock(...args),
}));

import {
  computeTourBookingQuote,
  executeSubmitTourBookingRequest,
  getTourAvailabilities,
  getTourBookingQuote,
  submitTourBookingRequest,
} from "@/lib/actions/booking-widget.actions";
import { BOOKING_WIDGET_PRICE_MISMATCH_ERROR } from "@/lib/actions/booking-widget-submit";
import {
  BOOKING_WIDGET_MAX_GROUP_SIZE_ERROR_CODE,
  formatMaxGroupSizeMessage,
} from "@/lib/booking-widget/max-group-size-message";

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
  localizedDate: futureIsoDate(),
  defaultRateId: 2199582,
  rates: [{ id: 2199582, minPerBooking: 1, maxPerBooking: 15 }],
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

const validSubmitInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  city: "Biarritz",
  productId: "1079932",
  productTitle: "Hello Biarritz",
  date: futureIsoDate(),
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  clientQuote: { totalAmount: 448, currency: "EUR" },
  consent: true,
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

  it("returns max group size error when total participants exceed maxPerBooking", async () => {
    const result = await computeTourBookingQuote({
      ...validQuoteInput,
      participants: { adults: 6, youth: 5, children: 5, infants: 0 },
    });

    expect(result).toEqual({
      success: false,
      error: formatMaxGroupSizeMessage(15),
      errorCode: BOOKING_WIDGET_MAX_GROUP_SIZE_ERROR_CODE,
      maxGroupSize: 15,
    });
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("quotes when total participants equal maxPerBooking", async () => {
    const result = await computeTourBookingQuote({
      ...validQuoteInput,
      participants: { adults: 5, youth: 5, children: 5, infants: 0 },
    });

    expect(result).toEqual({ success: true, data: sampleQuote });
    expect(calculateBookingQuoteMock).toHaveBeenCalled();
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

describe("submitTourBookingRequest — validation and submit pipeline", () => {
  beforeEach(() => {
    sendBookingWidgetRequestEmailsMock.mockReset();
    sendBookingWidgetRequestEmailsMock.mockResolvedValue({ success: true });
    stubSuccessfulQuotePipeline();
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "1079932",
        title: "Hello Biarritz",
        defaultRateId: 2199582,
        pricingCategories,
        startTimes: [{ id: 4252139, hour: 11, minute: 0 }],
        durationText: "2 hours",
        keyPhoto: { derived: [] },
      },
    });
  });

  it("validation invariant: rejects invalid submit payload before quote", async () => {
    const result = await submitTourBookingRequest({
      ...validSubmitInput,
      email: "not-an-email",
    });

    expect(result).toEqual({
      success: false,
      error: "Please enter a valid email address",
    });
    expect(calculateBookingQuoteMock).not.toHaveBeenCalled();
    expect(sendBookingWidgetRequestEmailsMock).not.toHaveBeenCalled();
  });

  it("tamper invariant: rejects mismatched clientQuote total", async () => {
    const result = await submitTourBookingRequest({
      ...validSubmitInput,
      clientQuote: { totalAmount: 1, currency: "EUR" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
    expect(sendBookingWidgetRequestEmailsMock).not.toHaveBeenCalled();
  });

  it("tamper invariant: rejects mismatched clientQuote currency", async () => {
    const result = await submitTourBookingRequest({
      ...validSubmitInput,
      clientQuote: { totalAmount: 448, currency: "USD" },
    });

    expect(result).toEqual({
      success: false,
      error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
    });
    expect(sendBookingWidgetRequestEmailsMock).not.toHaveBeenCalled();
  });

  it("happy path invariant: sends emails with server-verified quote", async () => {
    const result = await submitTourBookingRequest(validSubmitInput);

    expect(result).toEqual({ success: true });
    expect(sendBookingWidgetRequestEmailsMock).toHaveBeenCalledTimes(1);
    expect(sendBookingWidgetRequestEmailsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        totalAmount: 448,
        currency: "EUR",
        startTimeLabel: "11:00",
        productTitle: "Hello Biarritz",
      }),
    );
  });

  it("email invariant: returns error when delivery fails", async () => {
    sendBookingWidgetRequestEmailsMock.mockRejectedValue(
      new Error("SMTP rejected"),
    );

    const result = await executeSubmitTourBookingRequest(validSubmitInput);

    expect(result).toEqual({
      success: false,
      error: "Failed to send tour request. Please try again later.",
    });
  });
});
