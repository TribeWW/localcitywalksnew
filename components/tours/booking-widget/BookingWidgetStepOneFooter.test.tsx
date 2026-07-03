/**
 * BookingWidgetStepOneFooter — checkout CTA specs (LOC-1157).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetStepOneFooter from "@/components/tours/booking-widget/BookingWidgetStepOneFooter";

describe("BookingWidgetStepOneFooter", () => {
  it("renders Continue to checkout in checkout mode", () => {
    render(
      <BookingWidgetStepOneFooter
        canBookNow
        mode="checkout"
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Book now" }),
    ).not.toBeInTheDocument();
  });

  it("disables checkout CTA while handoff is in flight", () => {
    render(
      <BookingWidgetStepOneFooter
        canBookNow
        mode="checkout"
        continuing
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeDisabled();
  });

  it("calls onPrimaryAction when checkout CTA is clicked", () => {
    const onPrimaryAction = vi.fn();
    render(
      <BookingWidgetStepOneFooter
        canBookNow
        mode="checkout"
        onPrimaryAction={onPrimaryAction}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Continue to checkout" }),
    );
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
