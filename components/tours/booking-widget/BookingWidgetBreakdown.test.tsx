/**
 * BookingWidgetBreakdown — red/green TDD specs (LOC-1063).
 *
 * Critical invariants:
 * - aria-live polite region for price updates
 * - Error / loading / success / empty states are mutually exclusive
 * - Only lines with count > 0 render
 * - Tax copy uses mockup string "Price includes taxes and fees"
 * - showEmptyPrompt=false omits empty prompt (step 2 recap)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingWidgetBreakdown from "@/components/tours/booking-widget/BookingWidgetBreakdown";
import type { BookingWidgetQuote } from "@/types/bokun";

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1,
      categoryLabel: "Adult",
      count: 2,
      unitAmount: 124,
      lineTotal: 248,
      currency: "EUR",
    },
    {
      categoryId: 2,
      categoryLabel: "Youth",
      count: 0,
      unitAmount: 40,
      lineTotal: 0,
      currency: "EUR",
    },
    {
      categoryId: 3,
      categoryLabel: "Infant",
      count: 1,
      unitAmount: 0,
      lineTotal: 0,
      currency: "EUR",
    },
  ],
};

describe("BookingWidgetBreakdown — display invariants", () => {
  it("accessibility invariant: exposes aria-live polite region", () => {
    const { container } = render(
      <BookingWidgetBreakdown quote={null} loading={false} error={null} />,
    );

    const region = container.firstElementChild;
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("quote invariant: renders lines with count > 0, total, and tax copy", () => {
    render(
      <BookingWidgetBreakdown
        quote={sampleQuote}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText("Adult × 2")).toBeInTheDocument();
    expect(screen.queryByText(/Youth ×/)).not.toBeInTheDocument();
    expect(screen.getByText("Infant × 1")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("€448")).toBeInTheDocument();
    expect(
      screen.getByText("Price includes taxes and fees"),
    ).toBeInTheDocument();
  });

  it("loading invariant: shows busy skeleton", () => {
    const { container } = render(
      <BookingWidgetBreakdown quote={null} loading error={null} />,
    );

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });

  it("error invariant: surfaces error with role alert", () => {
    render(
      <BookingWidgetBreakdown
        quote={null}
        loading={false}
        error="Unable to calculate price"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to calculate price",
    );
  });

  it("empty invariant: shows prompt when showEmptyPrompt is true", () => {
    render(
      <BookingWidgetBreakdown quote={null} loading={false} error={null} />,
    );

    expect(
      screen.getByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).toBeInTheDocument();
  });

  it("empty invariant: omits prompt when showEmptyPrompt is false", () => {
    render(
      <BookingWidgetBreakdown
        quote={null}
        loading={false}
        error={null}
        showEmptyPrompt={false}
      />,
    );

    expect(
      screen.queryByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).not.toBeInTheDocument();
  });

  it("precedence invariant: error wins over loading and quote", () => {
    const { container } = render(
      <BookingWidgetBreakdown
        quote={sampleQuote}
        loading
        error="Unable to calculate price"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector("[aria-busy='true']")).not.toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });
});
