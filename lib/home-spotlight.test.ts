import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

vi.mock("@/lib/actions/tour-detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import { getHomeSpotlightCityCards } from "@/lib/home-spotlight";

const keyPhoto = {
  derived: [{ name: "preview", url: "/preview.jpg" }],
};

describe("getHomeSpotlightCityCards", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    getTourDetailByIdMock.mockReset();
  });

  it("maps spotlight ids to CityCardData compatible with listing enrichment", async () => {
    fetchMock.mockResolvedValue({
      items: [{ id: "1077682" }],
    });
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: 1077682,
        title: "Hello Toledo Private Walk",
        keyPhoto,
        googlePlace: {
          city: "Toledo",
          country: "Spain",
          countryCode: "ES",
          cityCode: "toledo",
        },
      },
    });

    const cards = await getHomeSpotlightCityCards();

    expect(getTourDetailByIdMock).toHaveBeenCalledWith("1077682");
    expect(cards).toEqual([
      {
        id: "1077682",
        title: "Toledo",
        image: "/preview.jpg",
        countryCode: "ES",
        country: "Spain",
        citySlug: "toledo",
        slug: "hello-toledo-private-walk-1077682",
      },
    ]);
  });

  it("returns an empty list when Sanity has no spotlight items", async () => {
    fetchMock.mockResolvedValue({ items: [] });

    await expect(getHomeSpotlightCityCards()).resolves.toEqual([]);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
  });
});
