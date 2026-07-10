import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    // Default to production so the Sanity branch is exercised; preview test overrides.
    vi.stubEnv("VERCEL_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
        title: "Hello Toledo Private Walk",
        cityName: "Toledo",
        image: "/preview.jpg",
        countryCode: "ES",
        country: "Spain",
        citySlug: "toledo",
        slug: "hello-toledo-private-walk-1077682",
      },
    ]);
  });

  it("normalizes numeric ids and skips null spotlight entries", async () => {
    fetchMock.mockResolvedValue({
      items: [{ id: 1077682 }, { id: null }],
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

    expect(getTourDetailByIdMock).toHaveBeenCalledTimes(1);
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("1077682");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual({
      id: "1077682",
      title: "Hello Toledo Private Walk",
      cityName: "Toledo",
      image: "/preview.jpg",
      countryCode: "ES",
      country: "Spain",
      citySlug: "toledo",
      slug: "hello-toledo-private-walk-1077682",
    });
  });

  it("returns an empty list when Sanity has no spotlight items", async () => {
    fetchMock.mockResolvedValue({ items: [] });

    await expect(getHomeSpotlightCityCards()).resolves.toEqual([]);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
  });

  it("uses curated bokuntest ids and skips Sanity outside production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    getTourDetailByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: 15683,
        title: "Test Walk",
        keyPhoto,
        googlePlace: {
          city: "Testville",
          country: "Testland",
          countryCode: "TT",
          cityCode: "testville",
        },
      },
    });

    const cards = await getHomeSpotlightCityCards();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("15683");
    expect(cards.length).toBeGreaterThan(0);
  });
});
