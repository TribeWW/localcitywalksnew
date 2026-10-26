import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

import { client } from "@/sanity/lib/client";
import type { SanityReviewListItem } from "@/types/review";
import {
  HOME_REVIEW_FETCH_LIMIT,
  HOME_REVIEW_RETURN_LIMIT,
  loadHomeReviews,
  selectHomeReviews,
  tourIdFromTourPagePath,
  type HomeReviewCityRow,
} from "./home-reviews";

const mockedFetch = vi.mocked(client.fetch);

function review(
  overrides: Partial<SanityReviewListItem> & Pick<SanityReviewListItem, "_id" | "tourId">,
): SanityReviewListItem {
  return {
    rating: 5,
    experienceDate: "2024-06-15T12:00:00.000Z",
    authorName: "Jane Doe",
    body: "A wonderful walk through the old streets.",
    ...overrides,
  };
}

function city(
  name: string,
  tourPagePath: string,
  countryName: string | null = "France",
): HomeReviewCityRow {
  return { name, tourPagePath, countryName };
}

describe("tourIdFromTourPagePath", () => {
  it("reads the digits after the last hyphen on a catalogue path", () => {
    expect(
      tourIdFromTourPagePath(
        "/tours/toledo/hello-toledo-private-walk-1077682",
      ),
    ).toBe("1077682");
  });

  it("ignores paths that are not catalogue tours or do not end in an id", () => {
    expect(tourIdFromTourPagePath("/about/walk-1077682")).toBeNull();
    expect(tourIdFromTourPagePath("/tours/paris/walk")).toBeNull();
    expect(tourIdFromTourPagePath("  /tours/paris/walk-12  ")).toBe("12");
  });
});

describe("selectHomeReviews", () => {
  const paris = city(
    "Paris",
    "/tours/paris/paris-walking-tour-101",
    "France",
  );
  const lyon = city("Lyon", "/tours/lyon/lyon-walking-tour-202", "France");

  it("keeps a written review with one city match and the place link fields", () => {
    const selected = selectHomeReviews(
      [review({ _id: "r1", tourId: "101", body: "  Lovely  " })],
      [paris],
    );

    expect(selected).toEqual([
      expect.objectContaining({
        _id: "r1",
        tourId: "101",
        body: "Lovely",
        cityName: "Paris",
        countryName: "France",
        cityHref: "/tours/paris/paris-walking-tour-101",
        authorName: "Jane Doe",
        experienceDate: "2024-06-15T12:00:00.000Z",
      }),
    ]);
  });

  it("drops rating only reviews and blank text", () => {
    const selected = selectHomeReviews(
      [
        review({ _id: "empty", tourId: "101", body: null }),
        review({ _id: "spaces", tourId: "101", body: "   " }),
        review({ _id: "kept", tourId: "202" }),
      ],
      [paris, lyon],
    );

    expect(selected.map((row) => row._id)).toEqual(["kept"]);
  });

  it("drops a review when no city path ends with its tour id", () => {
    const selected = selectHomeReviews(
      [review({ _id: "r1", tourId: "999" })],
      [paris],
    );
    expect(selected).toEqual([]);
  });

  it("drops a review when two published cities share the same tour id", () => {
    const selected = selectHomeReviews(
      [review({ _id: "r1", tourId: "101" })],
      [paris, city("Paris again", "/tours/paris/other-walk-101", "France")],
    );
    expect(selected).toEqual([]);
  });

  it("drops a review when the only path match has no country name", () => {
    const selected = selectHomeReviews(
      [review({ _id: "r1", tourId: "101" })],
      [city("Paris", "/tours/paris/paris-walking-tour-101", "  ")],
    );
    expect(selected).toEqual([]);
  });

  it("drops a review when a second path match is incomplete", () => {
    const selected = selectHomeReviews(
      [review({ _id: "r1", tourId: "101" })],
      [paris, city(" ", "/tours/paris/other-walk-101", "France")],
    );
    expect(selected).toEqual([]);
  });

  it("keeps later written matches after skipping rows that fail the filter", () => {
    const selected = selectHomeReviews(
      [
        review({ _id: "blank", tourId: "101", body: "" }),
        review({ _id: "unmatched", tourId: "404" }),
        review({ _id: "lyon", tourId: "202" }),
      ],
      [paris, lyon],
    );
    expect(selected.map((row) => row._id)).toEqual(["lyon"]);
  });

  it("returns at most 12 cards after filtering, in the incoming order", () => {
    const reviews = Array.from({ length: 15 }, (_, index) =>
      review({
        _id: `r${index}`,
        tourId: String(1000 + index),
      }),
    );
    const cities = reviews.map((row, index) =>
      city(`City ${index}`, `/tours/c/walk-${row.tourId}`, "Spain"),
    );

    const selected = selectHomeReviews(reviews, cities);

    expect(selected).toHaveLength(HOME_REVIEW_RETURN_LIMIT);
    expect(selected.map((row) => row._id)).toEqual(
      reviews.slice(0, HOME_REVIEW_RETURN_LIMIT).map((row) => row._id),
    );
  });
});

describe("loadHomeReviews", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("fetches 24 recent published reviews and published cities, then returns at most 12", async () => {
    const reviews = Array.from({ length: 14 }, (_, index) =>
      review({
        _id: `r${index}`,
        tourId: String(1000 + index),
        body: index === 0 ? "   " : "Written review",
      }),
    );
    const cities = reviews.map((row) =>
      city("Seville", `/tours/seville/walk-${row.tourId}`, "Spain"),
    );

    mockedFetch.mockImplementation(async (query: unknown) => {
      const text = String(query);
      if (text.includes('_type == "review"')) return reviews as never;
      if (text.includes('_type == "city"')) return cities as never;
      throw new Error(text);
    });

    const selected = await loadHomeReviews();

    expect(selected).toHaveLength(HOME_REVIEW_RETURN_LIMIT);
    expect(selected[0]?._id).toBe("r1");
    expect(mockedFetch).toHaveBeenCalledTimes(2);

    const reviewCall = mockedFetch.mock.calls.find((call) =>
      String(call[0]).includes('_type == "review"'),
    );
    const cityCall = mockedFetch.mock.calls.find((call) =>
      String(call[0]).includes('_type == "city"'),
    );
    const reviewQuery = String(reviewCall?.[0] ?? "");
    const cityQuery = String(cityCall?.[0] ?? "");

    expect(reviewCall?.[1]).toEqual({ lim: HOME_REVIEW_FETCH_LIMIT });
    expect(reviewQuery).toContain("drafts");
    expect(reviewQuery).toContain("experienceDate desc");
    expect(cityQuery).toContain("tourPagePath");
    expect(cityQuery).toContain("country->name");
    expect(cityQuery).toContain("drafts");
  });

  it("returns no cards when Sanity fails", async () => {
    mockedFetch.mockRejectedValue(new Error("Sanity unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadHomeReviews()).resolves.toEqual([]);

    spy.mockRestore();
  });
});
