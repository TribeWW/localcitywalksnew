/**
 * BookingWidgetMobileDrawer — red/green TDD specs.
 *
 * Full-screen overlay on small screens (&lt;md) hosting the configure step.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetMobileDrawer from "@/components/tours/booking-widget/BookingWidgetMobileDrawer";

describe("BookingWidgetMobileDrawer", () => {
  it("renders dialog with title, close button, and children when open", () => {
    render(
      <BookingWidgetMobileDrawer open onClose={vi.fn()}>
        <p>Configure form</p>
      </BookingWidgetMobileDrawer>,
    );

    expect(screen.getByTestId("booking-mobile-drawer")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Select dates & guests")).toBeInTheDocument();
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
    expect(screen.getByText("Configure form")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <BookingWidgetMobileDrawer open={false} onClose={vi.fn()}>
        <p>Configure form</p>
      </BookingWidgetMobileDrawer>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Configure form")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <BookingWidgetMobileDrawer open onClose={onClose}>
        <p>Configure form</p>
      </BookingWidgetMobileDrawer>,
    );

    fireEvent.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <BookingWidgetMobileDrawer open onClose={onClose}>
        <p>Configure form</p>
      </BookingWidgetMobileDrawer>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
