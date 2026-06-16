/**
 * BookingWidgetCollapsed — red/green TDD specs (LOC-1063).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetCollapsed from "@/components/tours/booking-widget/BookingWidgetCollapsed";

describe("BookingWidgetCollapsed", () => {
  it("renders Check availability CTA and trust badge", () => {
    render(<BookingWidgetCollapsed onCheckAvailability={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Check availability" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
  });

  it("calls onCheckAvailability when CTA is clicked", () => {
    const onCheckAvailability = vi.fn();
    render(
      <BookingWidgetCollapsed onCheckAvailability={onCheckAvailability} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check availability" }),
    );

    expect(onCheckAvailability).toHaveBeenCalledTimes(1);
  });
});
