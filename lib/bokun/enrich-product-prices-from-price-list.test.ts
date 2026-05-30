import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BokunPriceListResponse } from "@/types/bokun";

const getTourDetailByIdMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: (path: string) => `https://bokun.test${path}`,
  generateBokunHeaders: () => ({}),
}));

vi.mock("@/lib/bokun/config", () => ({
  BOKUN_ENDPOINTS: {
    PRICE_LIST: (id: string) => `/activity.json/${id}/price-list`,
  },
}));

const samplePriceList: BokunPriceListResponse = {
  defaultCurrency: "EUR",
  pricesByDateRange: [
    {
      from: "2026-01-01",
      to: "2027-12-31",
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

import {
  collectDefaultRateIdsFromCards,
  enrichProductPricesFromPriceList,
} from "@/lib/bokun/enrich-product-prices-from-price-list";

describe("collectDefaultRateIdsFromCards", () => {
  it("maps normalized product ids to defaultRateId from listing cards", () => {
    const map = collectDefaultRateIdsFromCards([
      { id: 1077682 as unknown as string, defaultRateId: 2199582 },
      { id: "202", defaultRateId: undefined },
    ]);

    expect(map.get("1077682")).toBe(2199582);
    expect(map.has("202")).toBe(false);
  });
});

describe("enrichProductPricesFromPriceList", () => {
  beforeEach(() => {
    getTourDetailByIdMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => samplePriceList,
    });
  });

  it("skips activity detail fetches when defaultRateId is already known", async () => {
    const headlines = await enrichProductPricesFromPriceList(
      ["1077682"],
      new Map([["1077682", 2199582]]),
    );

    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(headlines.get("1077682")).toEqual({
      amount: 124,
      currency: "EUR",
    });
  });

  it("prefetches defaultRateId once, then fetches only price-list per product", async () => {
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: { id: "202", title: "Tour", defaultRateId: 2199582 },
    });

    const headlines = await enrichProductPricesFromPriceList(["202"]);

    expect(getTourDetailByIdMock).toHaveBeenCalledTimes(1);
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("202");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(headlines.get("202")).toEqual({
      amount: 124,
      currency: "EUR",
    });
  });
});
