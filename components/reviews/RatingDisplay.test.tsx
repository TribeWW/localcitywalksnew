import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RatingDisplay,
  clampStarRating,
  formatScoreRatingLabel,
  formatStarRatingLabel,
} from "./RatingDisplay";

describe("clampStarRating", () => {
  it("rounds and clamps to 0–5", () => {
    expect(clampStarRating(4.6)).toBe(5);
    expect(clampStarRating(-1)).toBe(0);
    expect(clampStarRating(9)).toBe(5);
    expect(clampStarRating(Number.NaN)).toBe(0);
  });
});

describe("rating labels", () => {
  it("formats star and score announcements", () => {
    expect(formatStarRatingLabel(4)).toBe("4 out of 5 stars");
    expect(formatStarRatingLabel(0)).toBe("No star rating shown");
    expect(formatScoreRatingLabel("4.7")).toBe("Rated 4.7 out of 5");
  });
});

describe("RatingDisplay", () => {
  it("exposes a star row as an image with a rating label", () => {
    const { container } = render(
      <RatingDisplay variant="stars" value={4} />,
    );

    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(5);
  });

  it("announces a score badge without reading the visible number alone", () => {
    render(
      <RatingDisplay variant="score" value="4.7" valueClassName="score-value" />,
    );

    expect(screen.getByText("Rated 4.7 out of 5")).toHaveClass("sr-only");
    const visible = document.querySelector(".score-value");
    expect(visible).toHaveTextContent("4.7");
    expect(visible).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
