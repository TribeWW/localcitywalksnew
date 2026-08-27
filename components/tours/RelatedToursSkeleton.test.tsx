/**
 * RelatedToursSkeleton — Suspense fallback for the related-tours section.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelatedToursSkeleton } from "@/components/tours/RelatedToursSkeleton";

describe("RelatedToursSkeleton", () => {
  it("renders four card-shaped pulses with aria-hidden", () => {
    render(<RelatedToursSkeleton />);

    const root = screen.getByTestId("related-tours-skeleton");
    expect(root).toHaveAttribute("aria-hidden", "true");

    const cards = screen.getAllByTestId("related-tours-skeleton-card");
    expect(cards).toHaveLength(4);
  });
});
