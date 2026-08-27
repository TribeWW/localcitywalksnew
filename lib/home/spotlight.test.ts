import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const getTourDetailByIdMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

vi.mock("@/lib/tours/detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import {
  getHomeSpotlightCityCards,
  getHomeSpotlightProductIds,
} from "@/lib/home/spotlight";

const keyPhoto = {
  derived: [{ name: "preview", url: "/preview.jpg" }],
};

describe("getHomeSpotlightProductIds", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv("VERCEL_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns normalized production Sanity ids in editorial order", async () => {
    fetchMock.mockResolvedValue({
      items: [{ id: 1077682 }, { id: "999" }, { id: null }],
    });

    await expect(getHomeSpotlightProductIds()).resolves.toEqual([
      "1077682",
      "999",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses curated preview ids and skips Sanity outside production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    const ids = await getHomeSpotlightProductIds();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(ids).toEqual([
      "15683",
      "15684",
      "15685",
      "15686",
      "15687",
      "15688",
      "15689",
      "15690",
    ]);
  });

  it("returns an empty list when Sanity has no spotlight items", async () => {
    fetchMock.mockResolvedValue({ items: [] });

    await expect(getHomeSpotlightProductIds()).resolves.toEqual([]);
  });

  it("returns null when the Sanity fetch throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("Sanity down"));

    await expect(getHomeSpotlightProductIds()).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

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
