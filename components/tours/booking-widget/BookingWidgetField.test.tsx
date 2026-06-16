/**
 * BookingWidgetField — red/green TDD specs (LOC-1063).
 */

import { render, screen } from "@testing-library/react";
import { Calendar } from "lucide-react";
import { describe, expect, it } from "vitest";
import BookingWidgetField from "@/components/tours/booking-widget/BookingWidgetField";

describe("BookingWidgetField", () => {
  it("renders leading icon as decorative", () => {
    const { container } = render(
      <BookingWidgetField icon={Calendar}>
        <button type="button">Select a date</button>
      </BookingWidgetField>,
    );

    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Select a date" })).toBeInTheDocument();
  });

  it("wraps child controls in full-width container", () => {
    const { container } = render(
      <BookingWidgetField icon={Calendar}>
        <input aria-label="Date input" />
      </BookingWidgetField>,
    );

    expect(
      container.querySelector(".w-full input"),
    ).toBeInTheDocument();
  });
});
