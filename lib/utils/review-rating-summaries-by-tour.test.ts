import { describe, expect, it } from "vitest";
import {
  buildReviewRatingSummariesByTourId,
  normalizeTourIdsForBulkRating,
} from "@/lib/utils/review-rating-summaries-by-tour";

describe("normalizeTourIdsForBulkRating", () => {
  it("dedupes, keeps digits-only ids, and caps the list", () => {
    const ids = Array.from({ length: 55 }, (_, index) => String(index + 1));
    ids.push("1", "abc", "tour-42");

    expect(normalizeTourIdsForBulkRating(ids)).toEqual(
      Array.from({ length: 50 }, (_, index) => String(index + 1)),
    );
    expect(normalizeTourIdsForBulkRating(["tour-42", "42"])).toEqual(["42"]);
  });

  it("returns an empty list when no ids are valid", () => {
    expect(normalizeTourIdsForBulkRating(["", "abc", "no-digits"])).toEqual([]);
  });
});

describe("buildReviewRatingSummariesByTourId", () => {
  it("aggregates clamped star rows per requested tour id", () => {
    const summaries = buildReviewRatingSummariesByTourId(
      ["101", "202"],
      [
        { tourId: "101", s: 5 },
        { tourId: "101", s: 4 },
        { tourId: "202", s: 3 },
      ],
    );

    expect(summaries.get("101")).toMatchObject({
      totalCount: 2,
      meanDisplayStars: 4.5,
    });
    expect(summaries.get("202")).toMatchObject({
      totalCount: 1,
      meanDisplayStars: 3,
    });
  });

  it("returns empty summaries for requested tours with no review rows", () => {
    const summaries = buildReviewRatingSummariesByTourId(["303"], []);

    expect(summaries.get("303")).toMatchObject({
      totalCount: 0,
      meanDisplayStars: 0,
    });
  });
});
