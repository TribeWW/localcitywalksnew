/**
 * loadCheckoutSummary — red/green TDD specs (LOC-1154).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckoutHandoffPayload } from "@/lib/checkout/handoff-token";
import type { BokunProductDetail, BookingWidgetQuote } from "@/types/bokun";

const verifyCheckoutHandoffTokenMock = vi.fn();
const computeTourBookingQuoteMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/lib/checkout/handoff-token", () => ({
  verifyCheckoutHandoffToken: (...args: unknown[]) =>
    verifyCheckoutHandoffTokenMock(...args),
}));

vi.mock("@/lib/actions/booking-widget.actions", () => ({
  computeTourBookingQuote: (...args: unknown[]) =>
    computeTourBookingQuoteMock(...args),
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import { loadCheckoutSummary } from "@/lib/checkout/load-checkout-summary";

const handoffPayload: CheckoutHandoffPayload = {
  v: 1,
  exp: 1_900_000_000,
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  clientQuote: { totalAmount: 448, currency: "EUR" },
  productTitle: "Hello Biarritz",
};

const serverQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const tourDetail: BokunProductDetail = {
  id: "1079932",
  title: "Hello Biarritz",
  keyPhoto: {
    derived: [{ name: "large", url: "https://cdn.bokun.tools/photo.jpg" }],
  },
  googlePlace: { country: "France", countryCode: "FR", city: "Biarritz", cityCode: "biarritz" },
  startTimes: [{ id: 4252139, hour: 11, minute: 0 }],
};

describe("loadCheckoutSummary", () => {
  beforeEach(() => {
    verifyCheckoutHandoffTokenMock.mockReset();
    computeTourBookingQuoteMock.mockReset();
    getTourDetailByIdMock.mockReset();
  });

  it("returns invalid_handoff when token is missing", async () => {
    const result = await loadCheckoutSummary(undefined);

    expect(result).toEqual({
      status: "invalid_handoff",
      reason: "missing",
      tourPageHref: "/explore",
    });
    expect(verifyCheckoutHandoffTokenMock).not.toHaveBeenCalled();
  });

  it("returns invalid_handoff when token verification fails", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: false,
      error: "expired",
    });

    const result = await loadCheckoutSummary("bad.token");

    expect(result).toEqual({
      status: "invalid_handoff",
      reason: "expired",
      tourPageHref: "/explore",
    });
  });

  it("returns invalid_handoff with tour link when expired token has recovery payload", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: false,
      error: "expired",
      recoveryPayload: handoffPayload,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });

    const result = await loadCheckoutSummary("expired.token");

    expect(result.status).toBe("invalid_handoff");
    if (result.status !== "invalid_handoff") return;

    expect(result.reason).toBe("expired");
    expect(result.tourPageHref).toContain("/tours/biarritz/");
    expect(computeTourBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("returns quote_unavailable when tour detail cannot be loaded", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: true,
      payload: handoffPayload,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: false,
      error: "Tour not found",
    });

    const result = await loadCheckoutSummary("valid.token");

    expect(result).toEqual({
      status: "quote_unavailable",
      reason: "tour_detail_unavailable",
      productId: "1079932",
      message: "We couldn't load this tour's details. Please try again from the tour page.",
      tourPageHref: "/explore",
    });
    expect(computeTourBookingQuoteMock).not.toHaveBeenCalled();
  });

  it("returns sold_out quote_unavailable with policy copy when slot is gone", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: true,
      payload: handoffPayload,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });
    computeTourBookingQuoteMock.mockResolvedValue({
      success: false,
      error: "Unable to calculate quote for this selection",
    });

    const result = await loadCheckoutSummary("valid.token");

    expect(result.status).toBe("quote_unavailable");
    if (result.status !== "quote_unavailable") return;

    expect(result.reason).toBe("sold_out");
    expect(result.message).toContain("no longer available");
    expect(result.tourPageHref).toContain("/tours/biarritz/");
  });

  it("returns quote_unavailable when server re-quote fails", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: true,
      payload: handoffPayload,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });
    computeTourBookingQuoteMock.mockResolvedValue({
      success: false,
      error: "Unable to load availabilities",
    });

    const result = await loadCheckoutSummary("valid.token");

    expect(result.status).toBe("quote_unavailable");
    if (result.status !== "quote_unavailable") return;

    expect(result.productId).toBe("1079932");
    expect(result.reason).toBe("quote_error");
    expect(result.message).toContain("couldn't confirm availability");
    expect(result.tourPageHref).toContain("/tours/biarritz/");
  });

  it("happy path: returns live order summary from server quote", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: true,
      payload: handoffPayload,
    });
    computeTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: serverQuote,
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });

    const result = await loadCheckoutSummary("valid.token");

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.handoffToken).toBe("valid.token");
    expect(result.productId).toBe("1079932");
    expect(result.tourPageHref).toContain("/tours/biarritz/");
    expect(result.order).toMatchObject({
      title: "Hello Biarritz",
      totalAmount: 448,
      currency: "EUR",
      timeLabel: "11:00",
      imageUrl: expect.stringContaining("bokun"),
    });
    expect(computeTourBookingQuoteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "1079932",
        date: "2026-07-15",
        startTimeId: 4252139,
      }),
    );
    expect(result.priceUpdate).toBeNull();
  });

  it("returns priceUpdate when server re-quote differs from handoff clientQuote", async () => {
    verifyCheckoutHandoffTokenMock.mockReturnValue({
      success: true,
      payload: {
        ...handoffPayload,
        clientQuote: { totalAmount: 448, currency: "EUR" },
      },
    });
    computeTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: { ...serverQuote, totalAmount: 496 },
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: tourDetail,
    });

    const result = await loadCheckoutSummary("valid.token");

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.priceUpdate).toEqual({
      previousTotalAmount: 448,
      previousCurrency: "EUR",
      currentTotalAmount: 496,
      currentCurrency: "EUR",
    });
    expect(result.order.totalAmount).toBe(496);
  });
});
