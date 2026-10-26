import { describe, expect, it } from "vitest";
import { formatExperienceDate } from "./review-date";

describe("formatExperienceDate", () => {
  it("shows the UTC calendar date without a clock time", () => {
    expect(formatExperienceDate("2024-06-15T23:30:00.000Z")).toBe(
      "Jun 15, 2024",
    );
  });

  it("keeps the next UTC day when the instant is after midnight UTC", () => {
    expect(formatExperienceDate("2024-06-16T00:30:00.000Z")).toBe(
      "Jun 16, 2024",
    );
  });

  it("returns nothing for a value that is not a date", () => {
    expect(formatExperienceDate("not-a-date")).toBe("");
  });
});
