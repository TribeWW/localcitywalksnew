/**
 * BookingWidgetStepOneFooter — red/green TDD specs (LOC-1063).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetStepOneFooter from "@/components/tours/booking-widget/BookingWidgetStepOneFooter";

describe("BookingWidgetStepOneFooter", () => {
  it("disables Book now when canBookNow is false", () => {
    render(
      <BookingWidgetStepOneFooter canBookNow={false} onBookNow={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Book now" })).toBeDisabled();
  });

  it("enables Book now and calls onBookNow when canBookNow is true", () => {
    const onBookNow = vi.fn();
    render(
      <BookingWidgetStepOneFooter canBookNow onBookNow={onBookNow} />,
    );

    const button = screen.getByRole("button", { name: "Book now" });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onBookNow).toHaveBeenCalledTimes(1);
  });

  it("renders trust badge below CTA", () => {
    render(
      <BookingWidgetStepOneFooter canBookNow={false} onBookNow={vi.fn()} />,
    );

    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
  });
});
