/**
 * BookingWidgetShell — red/green TDD specs (LOC-1063).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingWidgetShell from "@/components/tours/booking-widget/BookingWidgetShell";

describe("BookingWidgetShell", () => {
  it("renders children inside sticky card chrome", () => {
    render(
      <BookingWidgetShell>
        <p>Widget content</p>
      </BookingWidgetShell>,
    );

    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("applies default sticky top offset of 96px", () => {
    const { container } = render(
      <BookingWidgetShell>
        <span>Child</span>
      </BookingWidgetShell>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.style.position).toBe("sticky");
    expect(shell.style.top).toBe("96px");
  });

  it("allows custom sticky top offset", () => {
    const { container } = render(
      <BookingWidgetShell stickyTop={120}>
        <span>Child</span>
      </BookingWidgetShell>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.style.top).toBe("120px");
  });
});
