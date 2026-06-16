/**
 * BookingWidgetTrustBadge — red/green TDD specs (LOC-1063).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingWidgetTrustBadge from "@/components/tours/booking-widget/BookingWidgetTrustBadge";

describe("BookingWidgetTrustBadge", () => {
  it("renders free cancellation copy", () => {
    render(<BookingWidgetTrustBadge />);

    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
    expect(
      screen.getByText("Until 24 hours before activity"),
    ).toBeInTheDocument();
  });
});
