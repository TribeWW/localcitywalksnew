/**
 * BookingSubmitSummary — red/green TDD specs (LOC-1054).
 *
 * Critical invariants:
 * - `formatParticipantSummary` omits zero-count categories
 * - Summary renders date, time, participants, language, and total when quote is ready
 * - Returns null without a quote
 * - Omits language row when no language code is provided
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingSubmitSummary, {
  formatParticipantSummary,
} from "@/components/tours/BookingSubmitSummary";
import type { BookingWidgetQuote } from "@/types/bokun";

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 448,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

describe("formatParticipantSummary", () => {
  it("lists only non-zero participant categories", () => {
    expect(
      formatParticipantSummary({
        adults: 1,
        youth: 2,
        children: 0,
        infants: 1,
      }),
    ).toBe("1 adult, 2 youth, 1 infant");
  });
});

describe("BookingSubmitSummary", () => {
  it("renders date, time, participants, language, and total when quote is ready", () => {
    render(
      <BookingSubmitSummary
        date={new Date(2026, 5, 15)}
        startTimeLabel="11:00"
        participants={{ adults: 1, youth: 0, children: 0, infants: 0 }}
        languageCode="EN_GB"
        quote={sampleQuote}
      />,
    );

    expect(screen.getByRole("region", { name: "Booking summary" })).toBeInTheDocument();
    expect(screen.getByText("Your booking")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
    expect(screen.getByText("1 adult")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("€448")).toBeInTheDocument();
  });

  it("returns null when quote is missing", () => {
    const { container } = render(
      <BookingSubmitSummary
        date={new Date(2026, 5, 15)}
        startTimeLabel="11:00"
        participants={{ adults: 1, youth: 0, children: 0, infants: 0 }}
        quote={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("omits language row when no language is selected", () => {
    render(
      <BookingSubmitSummary
        date={new Date(2026, 5, 15)}
        startTimeLabel="11:00"
        participants={{ adults: 2, youth: 0, children: 0, infants: 0 }}
        quote={sampleQuote}
      />,
    );

    expect(screen.queryByText("Language")).not.toBeInTheDocument();
  });
});
