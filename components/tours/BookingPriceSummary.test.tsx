/**
 * BookingPriceSummary — red/green TDD specs (LOC-1049).
 *
 * Critical invariants:
 * - Price region is announced (`aria-live="polite"`)
 * - Loading / error / empty / success states are mutually exclusive in UX copy
 * - Tax-inclusive helper text always shown with a valid quote
 * - Breakdown lines render only when `showBreakdown` is true
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingPriceSummary from "@/components/tours/BookingPriceSummary";
import type { BookingWidgetQuote } from "@/types/bokun";

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1045649,
      categoryLabel: "Adult",
      count: 1,
      unitAmount: 248,
      lineTotal: 248,
      currency: "EUR",
    },
    {
      categoryId: 1045650,
      categoryLabel: "Youth",
      count: 5,
      unitAmount: 40,
      lineTotal: 200,
      currency: "EUR",
    },
  ],
};

describe("BookingPriceSummary — display invariants", () => {
  it("accessibility invariant: exposes aria-live polite region", () => {
    render(
      <BookingPriceSummary quote={null} loading={false} error={null} />,
    );

    const region = screen.getByText(
      "Select participants, date, and time to see your total price.",
    ).parentElement;

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("loading invariant: shows busy skeleton without total or empty prompt", () => {
    const { container } = render(
      <BookingPriceSummary quote={null} loading error={null} />,
    );

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).not.toBeInTheDocument();
  });

  it("error invariant: surfaces error with role alert", () => {
    render(
      <BookingPriceSummary
        quote={null}
        loading={false}
        error="Unable to calculate price"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to calculate price",
    );
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
  });

  it("quote invariant: renders formatted total and tax-inclusive copy", () => {
    render(
      <BookingPriceSummary
        quote={sampleQuote}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText("€448")).toBeInTheDocument();
    expect(
      screen.getByText("Includes all taxes and fees"),
    ).toBeInTheDocument();
  });

  it("breakdown invariant: lists line items only when showBreakdown is true", () => {
    const { rerender } = render(
      <BookingPriceSummary
        quote={sampleQuote}
        loading={false}
        error={null}
        showBreakdown={false}
      />,
    );

    expect(screen.queryByText(/1 × Adult/)).not.toBeInTheDocument();

    rerender(
      <BookingPriceSummary
        quote={sampleQuote}
        loading={false}
        error={null}
        showBreakdown
      />,
    );

    expect(screen.getByText(/1 × Adult/)).toBeInTheDocument();
    expect(screen.getByText(/5 × Youth/)).toBeInTheDocument();
    expect(screen.getByText("€248")).toBeInTheDocument();
    expect(screen.getByText("€200")).toBeInTheDocument();
  });

  it("precedence invariant: error wins over loading and quote", () => {
    const { container } = render(
      <BookingPriceSummary
        quote={sampleQuote}
        loading
        error="Unable to calculate price"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to calculate price",
    );
    expect(container.querySelector("[aria-busy='true']")).not.toBeInTheDocument();
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).not.toBeInTheDocument();
  });

  it("empty invariant: prompts user when quote is null and not loading", () => {
    render(
      <BookingPriceSummary quote={null} loading={false} error={null} />,
    );

    expect(
      screen.getByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).toBeInTheDocument();
  });
});
