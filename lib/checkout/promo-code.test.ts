import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ValidatePromoCodeResult } from "@/lib/checkout/promo-code";

const {
  verifyCheckoutHandoffTokenMock,
  computeTourBookingQuoteMock,
  getTourDetailByIdMock,
  fetchBokunCheckoutOptionsMock,
  buildBokunBookingRequestMock,
  findReserveCheckoutOptionMock,
} = vi.hoisted(() => ({
  verifyCheckoutHandoffTokenMock: vi.fn(),
  computeTourBookingQuoteMock: vi.fn(),
  getTourDetailByIdMock: vi.fn(),
  fetchBokunCheckoutOptionsMock: vi.fn(),
  buildBokunBookingRequestMock: vi.fn((input) => ({
    ...input,
    promoCode: input.promoCode,
  })),
  findReserveCheckoutOptionMock: vi.fn((options) => options[0]),
}));

vi.mock("@/lib/checkout/handoff-token", () => ({
  verifyCheckoutHandoffToken: verifyCheckoutHandoffTokenMock,
}));

vi.mock("@/lib/booking/widget.actions", () => ({
  computeTourBookingQuote: computeTourBookingQuoteMock,
}));

vi.mock("@/lib/tours/detail.actions", () => ({
  getTourDetailById: getTourDetailByIdMock,
}));

vi.mock("@/lib/bokun/checkout", () => ({
  buildBokunBookingRequest: buildBokunBookingRequestMock,
  fetchBokunCheckoutOptions: fetchBokunCheckoutOptionsMock,
  findReserveCheckoutOption: findReserveCheckoutOptionMock,
}));

import {
  PROMO_VALIDATION_PLACEHOLDER_CONTACT,
  runValidatePromoCode,
} from "@/lib/checkout/promo-code";

const quote = {
  totalAmount: 500,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1045649,
      categoryLabel: "Adult",
      count: 1,
      unitAmount: 500,
      lineTotal: 500,
      currency: "EUR",
    },
  ],
} as const;

const payload = {
  productId: "1079932",
  date: "2026-06-12",
  startTimeId: 4252139,
  participants: { adults: 1, youth: 0, children: 0, infants: 0 },
  language: "en",
  clientQuote: {
    totalAmount: 500,
    currency: "EUR",
    source: "bokun-availability",
    breakdown: quote.breakdown,
  },
  productTitle: "Hello Tour",
};

beforeEach(() => {
  verifyCheckoutHandoffTokenMock.mockReset();
  computeTourBookingQuoteMock.mockReset();
  getTourDetailByIdMock.mockReset();
  fetchBokunCheckoutOptionsMock.mockReset();
  buildBokunBookingRequestMock.mockClear();

  verifyCheckoutHandoffTokenMock.mockReturnValue({
    success: true,
    payload,
  });

  computeTourBookingQuoteMock.mockResolvedValue({
    success: true,
    data: quote,
  });

  getTourDetailByIdMock.mockResolvedValue({
    success: true,
    data: {
      defaultRateId: 2199582,
      pricingCategories: [],
    },
  });
});

function asValidateResult(
  result: ValidatePromoCodeResult,
): Extract<ValidatePromoCodeResult, { success: true }> {
  if (!result.success) {
    throw new Error("Expected success result");
  }
  return result;
}

describe("runValidatePromoCode", () => {
  it("marks valid when promo code changes Bókun checkout option amount", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({
      success: true,
      data: {
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            amount: 400,
            currency: "EUR",
            paymentMethods: {
              allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
            },
          },
        ],
      },
    });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "SUMMER20",
    });

    const success = asValidateResult(result);
    expect(success.data.valid).toBe(true);
    expect(success.data.originalAmount).toBe(500);
    expect(success.data.discountedAmount).toBe(400);
    expect(success.data.discountAmount).toBe(100);

    expect(buildBokunBookingRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        promoCode: "SUMMER20",
        contact: PROMO_VALIDATION_PLACEHOLDER_CONTACT,
      }),
    );
    expect(fetchBokunCheckoutOptionsMock).toHaveBeenCalledTimes(1);
  });

  it("does not require customer contact details to validate a promo code", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({
      success: true,
      data: {
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            amount: 400,
            currency: "EUR",
            paymentMethods: {
              allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
            },
          },
        ],
      },
    });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "SUMMER20",
    });

    expect(result.success).toBe(true);
    expect(buildBokunBookingRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contact: PROMO_VALIDATION_PLACEHOLDER_CONTACT,
      }),
    );
  });

  it("marks invalid when promo code does not change Bókun checkout option amount", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({
      success: true,
      data: {
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            amount: 500,
            currency: "EUR",
            paymentMethods: {
              allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
            },
          },
        ],
      },
    });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "FOOBAR",
    });

    const success = asValidateResult(result);
    expect(success.data.valid).toBe(false);
    expect(success.data.originalAmount).toBe(500);
    expect(success.data.discountedAmount).toBe(500);
    expect(success.data.discountAmount).toBe(0);
  });

  it("rejects clearly invalid promo code format without calling Bókun", async () => {
    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "SUMMER 20", // whitespace is not allowed
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected failure result");
    }

    expect(result.error).toBe("invalid_promo_code");
    expect(fetchBokunCheckoutOptionsMock).not.toHaveBeenCalled();
    expect(verifyCheckoutHandoffTokenMock).not.toHaveBeenCalled();
  });

  it("maps Bókun options failures to invalid_promo_code for Apply UX", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({ success: false });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "BADCODE",
    });

    expect(result).toEqual({
      success: false,
      error: "invalid_promo_code",
    });
  });

  it("rejects negative promo-adjusted amounts from Bókun options", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({
      success: true,
      data: {
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            amount: -1,
            currency: "EUR",
            paymentMethods: {
              allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
            },
          },
        ],
      },
    });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "SUMMER20",
    });

    expect(result).toEqual({
      success: false,
      error: "invalid_response",
    });
  });

  it("rejects non-finite promo-adjusted amounts from Bókun options", async () => {
    fetchBokunCheckoutOptionsMock.mockResolvedValue({
      success: true,
      data: {
        options: [
          {
            type: "CUSTOMER_FULL_PAYMENT",
            amount: Number.POSITIVE_INFINITY,
            currency: "EUR",
            paymentMethods: {
              allowedMethods: ["RESERVE_FOR_EXTERNAL_PAYMENT", "CARD"],
            },
          },
        ],
      },
    });

    const result = await runValidatePromoCode({
      handoffToken: "handoff-token",
      promoCode: "SUMMER20",
    });

    expect(result).toEqual({
      success: false,
      error: "invalid_response",
    });
  });
});
