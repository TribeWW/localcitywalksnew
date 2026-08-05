import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BokunPriceListResponse, CityCardData } from "@/types/bokun";

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

import { warmListingPricesForCards } from "@/lib/city-cards/warm-listing-prices-for-cards";

const baseCard = (overrides: Partial<CityCardData> = {}): CityCardData => ({
  id: "1077682",
  title: "Barcelona Walk",
  image: "/preview.jpg",
  ...overrides,
});

describe("warmListingPricesForCards", () => {
  beforeEach(() => {
    getTourDetailByIdMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => samplePriceList,
    });
  });

  it("returns an empty array for empty input", async () => {
    await expect(warmListingPricesForCards([])).resolves.toEqual([]);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches activity detail then price-list when defaultRateId is missing", async () => {
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: { id: "202", title: "Tour", defaultRateId: 2199582 },
    });

    const input = [baseCard({ id: "202" })];
    const warmed = await warmListingPricesForCards(input);

    expect(getTourDetailByIdMock).toHaveBeenCalledTimes(1);
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("202");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warmed[0]).toMatchObject({
      id: "202",
      defaultRateId: 2199582,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
    });
    expect(input[0]?.defaultRateId).toBeUndefined();
  });

  it("skips activity detail when defaultRateId is already known", async () => {
    const warmed = await warmListingPricesForCards([
      baseCard({ defaultRateId: 2199582 }),
    ]);

    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warmed[0]).toMatchObject({
      id: "1077682",
      defaultRateId: 2199582,
      displayPricePerPerson: 124,
      displayPriceCurrency: "EUR",
    });
  });

  it("does not mutate the input card array", async () => {
    const cards = [baseCard({ defaultRateId: 2199582 })];
    await warmListingPricesForCards(cards);

    expect(cards[0]).toEqual(baseCard({ defaultRateId: 2199582 }));
  });
});
