import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BokunAvailability } from "@/types/bokun";

const fetchMock = vi.fn();

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: (path: string) => `https://bokun.test${path}`,
  generateBokunHeaders: () => ({}),
}));

vi.mock("@/lib/bokun/config", () => ({
  BOKUN_ENDPOINTS: {
    AVAILABILITIES: (id: string) => `/activity.json/${id}/availabilities`,
  },
}));

import {
  buildAvailabilitiesCacheKey,
  clearAvailabilitiesCache,
  fetchAvailabilities,
} from "@/lib/bokun/fetch-availabilities";

const sampleSlot: BokunAvailability = {
  id: "4252139_20260612",
  activityId: 1079932,
  startTimeId: 4252139,
  date: 1781222400000,
  pricesByRate: [
    {
      activityRateId: 2199582,
      pricePerCategoryUnit: [
        {
          id: 1045649,
          amount: { amount: 248, currency: "EUR" },
          minParticipantsRequired: 1,
          maxParticipantsRequired: 1,
        },
      ],
    },
  ],
  guidedLanguages: [],
  soldOut: false,
};

const requestParams = {
  start: "2026-06-12",
  end: "2026-06-13",
  currency: "EUR",
} as const;

describe("buildAvailabilitiesCacheKey", () => {
  it("keys cache by productId, start, end, and currency", () => {
    expect(
      buildAvailabilitiesCacheKey("1079932", "2026-06-12", "2026-06-13", "EUR"),
    ).toBe("bokun-availabilities-1079932-2026-06-12-2026-06-13-EUR");
  });
});

describe("fetchAvailabilities", () => {
  beforeEach(() => {
    clearAvailabilitiesCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [sampleSlot],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns availability rows from Bókun", async () => {
    const result = await fetchAvailabilities("1079932", requestParams);

    expect(result).toEqual({ success: true, data: [sampleSlot] });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://bokun.test/activity.json/1079932/availabilities?start=2026-06-12&end=2026-06-13&lang=EN&currency=EUR&includeSoldOut=false",
    );
  });

  it("returns cached data on second call within TTL", async () => {
    const first = await fetchAvailabilities("1079932", requestParams);
    const second = await fetchAvailabilities("1079932", requestParams);

    expect(first).toEqual({ success: true, data: [sampleSlot] });
    expect(second).toEqual({ success: true, data: [sampleSlot] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("refetches when cache key differs", async () => {
    await fetchAvailabilities("1079932", requestParams);
    await fetchAvailabilities("1079932", {
      ...requestParams,
      end: "2026-06-14",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refetches after cache TTL expires", async () => {
    vi.useFakeTimers();

    await fetchAvailabilities("1079932", requestParams);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    await fetchAvailabilities("1079932", requestParams);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns error when Bókun responds with non-OK status", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await fetchAvailabilities("1079932", requestParams);

    expect(result).toEqual({
      success: false,
      error: "Unable to load availabilities",
    });
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("returns error when response is not an array", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const result = await fetchAvailabilities("1079932", requestParams);

    expect(result).toEqual({
      success: false,
      error: "Unable to load availabilities",
    });
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
