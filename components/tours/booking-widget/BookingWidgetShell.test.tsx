/**
 * BookingWidgetShell — red/green TDD specs (LOC-1063).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingWidgetShell from "@/components/tours/booking-widget/BookingWidgetShell";

describe("BookingWidgetShell", () => {
  it("renders children inside card chrome", () => {
    render(
      <BookingWidgetShell>
        <p>Widget content</p>
      </BookingWidgetShell>,
    );

    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("renders bordered card styling without inline sticky positioning", () => {
    const { container } = render(
      <BookingWidgetShell>
        <span>Child</span>
      </BookingWidgetShell>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell).toHaveClass("rounded-lg", "border-border", "bg-white");
    expect(shell.style.position).toBe("");
  });
});
