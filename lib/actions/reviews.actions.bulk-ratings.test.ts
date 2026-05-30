import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

import { getReviewRatingSummariesForTourIds } from "@/lib/actions/reviews.actions";

describe("getReviewRatingSummariesForTourIds", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns per-tour summaries and global summary from one projection fetch", async () => {
    fetchMock.mockImplementation((query: string) => {
      if (query.includes("tourId in $tourIds")) {
        return Promise.resolve([
          { tourId: "101", s: 5 },
          { tourId: "101", s: 4 },
        ]);
      }

      return Promise.resolve({
        total: 2,
        c0: 0,
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 1,
        c5: 1,
      });
    });

    const result = await getReviewRatingSummariesForTourIds(["101", "202"]);

    expect(result.perTourMap.get("101")).toMatchObject({
      totalCount: 2,
      meanDisplayStars: 4.5,
    });
    expect(result.perTourMap.get("202")).toMatchObject({
      totalCount: 0,
      meanDisplayStars: 0,
    });
    expect(result.globalSummary).toMatchObject({
      totalCount: 2,
      meanDisplayStars: 4.5,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty per-tour map when the projection fetch fails", async () => {
    fetchMock.mockImplementation((query: string) => {
      if (query.includes("tourId in $tourIds")) {
        return Promise.reject(new Error("sanity down"));
      }

      return Promise.resolve({
        total: 1,
        c0: 0,
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        c5: 1,
      });
    });

    const result = await getReviewRatingSummariesForTourIds(["101"]);

    expect(result.perTourMap.size).toBe(0);
    expect(result.globalSummary).toMatchObject({
      totalCount: 1,
      meanDisplayStars: 5,
    });
  });
});
