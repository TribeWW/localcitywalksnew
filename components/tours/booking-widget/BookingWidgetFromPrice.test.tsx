/**
 * BookingWidgetFromPrice — red/green TDD specs (LOC-1063).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingWidgetFromPrice from "@/components/tours/booking-widget/BookingWidgetFromPrice";

describe("BookingWidgetFromPrice", () => {
  it("renders From price per adult when amount and currency are provided", () => {
    render(<BookingWidgetFromPrice amount={124} currency="EUR" />);

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("€124.00")).toBeInTheDocument();
    expect(screen.getByText("per adult")).toBeInTheDocument();
  });

  it("returns null when amount is missing", () => {
    const { container } = render(
      <BookingWidgetFromPrice currency="EUR" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when currency is missing", () => {
    const { container } = render(<BookingWidgetFromPrice amount={124} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders compact typography when size is compact", () => {
    render(<BookingWidgetFromPrice amount={124} currency="EUR" size="compact" />);

    const price = screen.getByText("€124.00");
    expect(price).toHaveClass("text-xl");
    expect(screen.getByText("From")).toHaveClass("text-xs");
    expect(screen.getByText("per adult")).toHaveClass("text-xs");
  });
});
