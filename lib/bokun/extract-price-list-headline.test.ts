import { describe, expect, it } from "vitest";
import {
  extractHeadlineFromPriceList,
  pickTwoGuestTier,
} from "@/lib/bokun/extract-price-list-headline";
import type { BokunPriceListResponse } from "@/types/bokun";

const samplePriceList: BokunPriceListResponse = {
  defaultCurrency: "EUR",
  pricesByDateRange: [
    {
      from: "2026-05-10",
      to: "2027-05-10",
      rates: [
        {
          rateId: 2199582,
          title: "Private Tour",
          passengers: [
            {
              title: "Adult",
              ticketCategory: "ADULT",
              tieredPrices: [
                {
                  currency: "EUR",
                  amount: 248,
                  minPassengersRequired: 1,
                  maxPassengersRequired: 1,
                },
                {
                  currency: "EUR",
                  amount: 124,
                  minPassengersRequired: 2,
                  maxPassengersRequired: 2,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("pickTwoGuestTier", () => {
  it("prefers minPassengersRequired === 2", () => {
    const tier = pickTwoGuestTier(
      samplePriceList.pricesByDateRange![0]!.rates[0]!.passengers[0]!
        .tieredPrices,
    );
    expect(tier?.amount).toBe(124);
  });
});

describe("extractHeadlineFromPriceList", () => {
  it("returns Adult 2-guest amount for the default rate", () => {
    const headline = extractHeadlineFromPriceList(
      samplePriceList,
      2199582,
      "2026-06-01",
      "1107331",
    );

    expect(headline).toEqual({ amount: 124, currency: "EUR" });
  });

  it("returns null when defaultRateId is missing", () => {
    const headline = extractHeadlineFromPriceList(
      samplePriceList,
      undefined,
      "2026-06-01",
    );

    expect(headline).toBeNull();
  });
});
