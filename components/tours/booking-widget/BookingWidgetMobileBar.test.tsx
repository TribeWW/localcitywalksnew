/**
 * BookingWidgetMobileBar — red/green TDD specs.
 *
 * Fixed bottom bar for small screens (&lt;md): compact from-price and
 * “Check availability” entry point into the full-screen drawer.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetMobileBar from "@/components/tours/booking-widget/BookingWidgetMobileBar";

describe("BookingWidgetMobileBar", () => {
  it("renders compact from-price and Check availability CTA", () => {
    render(
      <BookingWidgetMobileBar
        visible
        amount={124}
        currency="EUR"
        onCheckAvailability={vi.fn()}
      />,
    );

    expect(screen.getByTestId("booking-mobile-bar")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("€124.00")).toBeInTheDocument();
    expect(screen.getByText("per adult")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check availability" }),
    ).toBeInTheDocument();
  });

  it("is visually hidden when visible is false", () => {
    render(
      <BookingWidgetMobileBar
        visible={false}
        amount={124}
        currency="EUR"
        onCheckAvailability={vi.fn()}
      />,
    );

    const bar = screen.getByTestId("booking-mobile-bar");
    expect(bar).toHaveClass("translate-y-full");
    expect(bar).toHaveClass("opacity-0");
    expect(bar).toHaveClass("pointer-events-none");
  });

  it("ports to document.body and pads for the safe-area inset", () => {
    render(
      <BookingWidgetMobileBar
        visible
        amount={124}
        currency="EUR"
        onCheckAvailability={vi.fn()}
      />,
    );

    const bar = screen.getByTestId("booking-mobile-bar");
    expect(bar.parentElement).toBe(document.body);
    expect(bar.className).toContain("safe-area-inset-bottom");
    expect(bar).toHaveClass("bottom-0");
  });

  it("calls onCheckAvailability when CTA is clicked", () => {
    const onCheckAvailability = vi.fn();
    render(
      <BookingWidgetMobileBar
        visible
        amount={124}
        currency="EUR"
        onCheckAvailability={onCheckAvailability}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check availability" }),
    );

    expect(onCheckAvailability).toHaveBeenCalledTimes(1);
  });
});
