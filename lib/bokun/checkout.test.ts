/**
 * Bókun checkout reserve — red/green TDD specs (LOC-1160 / PRD Task 3.2).
 *
 * Critical invariants:
 * - Booking request expands quote breakdown into per-guest passenger rows
 * - Options + submit use signed paths with `currency=EUR` on `.bokuntest.com`
 * - Reserve requires `RESERVE_FOR_EXTERNAL_PAYMENT` on a checkout option
 * - Success returns `confirmationCode` for pending-checkout KV correlation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetQuote } from "@/types/bokun";

const fetchMock = vi.fn();

vi.mock("@/lib/bokun", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bokun")>();
  return {
    ...actual,
    generateBokunHeaders: () => ({}),
  };
});

vi.mock("@/lib/bokun/config", () => ({
  bokunConfig: {
    accessKey: "test-access-key",
    secretKey: "test-secret-key",
    domain: "localcitywalks",
  },
  BOKUN_ENDPOINTS: {
    CHECKOUT_OPTIONS: "/checkout.json/options/booking-request",
    CHECKOUT_SUBMIT: "/checkout.json/submit",
    ABORT_RESERVED: (confirmationCode: string) =>
      `/booking.json/${confirmationCode}/abort-reserved`,
  },
}));

import { createBokunUrl, getBokunApiHost } from "@/lib/bokun";
import {
  buildBokunBookingRequest,
  buildCheckoutPassengersFromQuote,
  buildMainContactDetails,
  buildReserveSubmitBody,
  checkoutOptionMatchesQuote,
  extractBokunConfirmationCode,
  findReserveCheckoutOption,
  reserveBokunCheckout,
  abortReservedBokunCheckout,
  type ReserveBokunCheckoutInput,
} from "@/lib/bokun/checkout";

const quote: BookingWidgetQuote = {
  totalAmount: 496,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1045649,
      categoryLabel: "Adult",
      count: 2,
      unitAmount: 248,
      lineTotal: 496,
      currency: "EUR",
    },
  ],
};

const reserveInput: ReserveBokunCheckoutInput = {
  productId: "1079932",
  date: "2026-06-12",
  startTimeId: 4252139,
  rateId: 2199582,
  quote,
  language: "en",
  contact: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+34600000000",
  },
  externalBookingReference: "550e8400-e29b-41d4-a716-446655440000",
};

const optionsResponse = {
  options: [
    {
      type: "CUSTOMER_FULL_PAYMENT",
      amount: 496,
      currency: "EUR",
      paymentMethods: {
        allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
      },
    },
  ],
};

const submitResponse = {
  booking: {
    confirmationCode: "LOC-T123",
    id: 987654,
  },
};

describe("buildCheckoutPassengersFromQuote", () => {
  it("expands each breakdown line into one passenger row per guest", () => {
    expect(buildCheckoutPassengersFromQuote(quote.breakdown)).toEqual([
      { pricingCategoryId: 1045649 },
      { pricingCategoryId: 1045649 },
    ]);
  });
});

describe("buildMainContactDetails", () => {
  it("maps checkout contact fields to Bókun question ids", () => {
    expect(buildMainContactDetails(reserveInput.contact)).toEqual([
      { questionId: "firstName", values: ["Ada"] },
      { questionId: "lastName", values: ["Lovelace"] },
      { questionId: "email", values: ["ada@example.com"] },
      { questionId: "phoneNumber", values: ["+34600000000"] },
    ]);
  });

  it("omits phoneNumber when contact phone is absent", () => {
    expect(
      buildMainContactDetails({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      }),
    ).toEqual([
      { questionId: "firstName", values: ["Ada"] },
      { questionId: "lastName", values: ["Lovelace"] },
      { questionId: "email", values: ["ada@example.com"] },
    ]);
  });
});

describe("buildBokunBookingRequest", () => {
  it("builds a single-activity booking request with guided language", () => {
    const request = buildBokunBookingRequest(reserveInput);

    expect(request.externalBookingReference).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(request.mainContactDetails).toHaveLength(4);
    expect(request.activityBookings).toEqual([
      {
        activityId: 1079932,
        rateId: 2199582,
        date: "2026-06-12",
        startTimeId: 4252139,
        pickup: false,
        dropoff: false,
        passengers: [
          { pricingCategoryId: 1045649 },
          { pricingCategoryId: 1045649 },
        ],
        extras: [],
        guidedLanguage: "en",
      },
    ]);
  });
});

describe("findReserveCheckoutOption", () => {
  it("returns the first option that allows RESERVE_FOR_EXTERNAL_PAYMENT", () => {
    expect(findReserveCheckoutOption(optionsResponse.options)).toEqual(
      optionsResponse.options[0],
    );
  });

  it("returns null when reserve is not offered", () => {
    expect(
      findReserveCheckoutOption([
        {
          type: "CUSTOMER_FULL_PAYMENT",
          paymentMethods: { allowedMethods: ["CARD"] },
        },
      ]),
    ).toBeNull();
  });
});

describe("buildReserveSubmitBody", () => {
  it("wraps the booking request in a reserve-for-external-payment submit payload", () => {
    const bookingRequest = buildBokunBookingRequest(reserveInput);

    expect(
      buildReserveSubmitBody("CUSTOMER_FULL_PAYMENT", bookingRequest),
    ).toEqual({
      checkoutOption: "CUSTOMER_FULL_PAYMENT",
      paymentMethod: "RESERVE_FOR_EXTERNAL_PAYMENT",
      source: "DIRECT_REQUEST",
      directBooking: bookingRequest,
      sendNotificationToMainContact: false,
      externalBookingReference: bookingRequest.externalBookingReference,
    });
  });
});

describe("extractBokunConfirmationCode", () => {
  it("reads confirmationCode from submit response booking", () => {
    expect(extractBokunConfirmationCode(submitResponse)).toBe("LOC-T123");
  });

  it("returns null when confirmation code is missing", () => {
    expect(extractBokunConfirmationCode({ booking: {} })).toBeNull();
  });
});

describe("createBokunUrl — test host", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses bokuntest.com outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BOKUN_API_HOST", "");
    vi.stubEnv("BOKUN_USE_TEST", "");

    expect(getBokunApiHost()).toBe("bokuntest.com");
    expect(createBokunUrl("/checkout.json/submit")).toBe(
      "https://localcitywalks.bokuntest.com/checkout.json/submit",
    );
  });
});

describe("checkoutOptionMatchesQuote", () => {
  it("accepts when amount and currency match the server quote", () => {
    expect(
      checkoutOptionMatchesQuote(
        { amount: 496, currency: "EUR" },
        quote,
      ),
    ).toBe(true);
  });

  it("accepts when option omits currency and amount matches", () => {
    expect(checkoutOptionMatchesQuote({ amount: 496 }, quote)).toBe(true);
  });

  it("rejects when checkout option amount differs from quote total", () => {
    expect(
      checkoutOptionMatchesQuote(
        { amount: 500, currency: "EUR" },
        quote,
      ),
    ).toBe(false);
  });

  it("rejects when checkout option currency differs from quote", () => {
    expect(
      checkoutOptionMatchesQuote(
        { amount: 496, currency: "USD" },
        quote,
      ),
    ).toBe(false);
  });
});

describe("reserveBokunCheckout", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts options then reserve submit and returns confirmationCode", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => optionsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => submitResponse,
      });

    const result = await reserveBokunCheckout(reserveInput);

    expect(result).toEqual({
      success: true,
      data: {
        confirmationCode: "LOC-T123",
        checkoutAmount: 496,
        currency: "EUR",
        externalBookingReference: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const optionsUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(optionsUrl).toContain("localcitywalks.bokuntest.com");
    expect(optionsUrl).toContain("/checkout.json/options/booking-request");
    expect(optionsUrl).toContain("currency=EUR");

    const submitUrl = String(fetchMock.mock.calls[1]?.[0]);
    expect(submitUrl).toContain("/checkout.json/submit");
    expect(submitUrl).toContain("currency=EUR");

    const submitBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    ) as { paymentMethod: string };
    expect(submitBody.paymentMethod).toBe("RESERVE_FOR_EXTERNAL_PAYMENT");
  });

  it("returns options_failed when checkout options request is not ok", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "bad request" }),
    });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "options_failed",
    });
  });

  it("returns reserve_unavailable when no option supports external reserve", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            paymentMethods: { allowedMethods: ["CARD"] },
          },
        ],
      }),
    });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "reserve_unavailable",
    });
  });

  it("returns reserve_failed when submit request is not ok", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => optionsResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: "sold out" }),
      });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "reserve_failed",
    });
  });

  it("returns invalid_response when checkout option amount mismatches quote", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        options: [
          {
            ...optionsResponse.options[0],
            amount: 500,
          },
        ],
      }),
    });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "invalid_response",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns invalid_response when checkout option currency mismatches quote", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        options: [
          {
            ...optionsResponse.options[0],
            currency: "USD",
          },
        ],
      }),
    });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "invalid_response",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns invalid_response when submit succeeds without confirmationCode", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => optionsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ booking: {} }),
      });

    await expect(reserveBokunCheckout(reserveInput)).resolves.toEqual({
      success: false,
      error: "invalid_response",
    });
  });
});

describe("abortReservedBokunCheckout", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts abort-reserved for the confirmation code", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await expect(abortReservedBokunCheckout("LOC-T123")).resolves.toEqual({
      success: true,
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/booking.json/LOC-T123/abort-reserved");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns failure when abort request is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409 });

    await expect(abortReservedBokunCheckout("LOC-T123")).resolves.toEqual({
      success: false,
    });
  });
});
