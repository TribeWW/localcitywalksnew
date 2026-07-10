/**
 * BookingGuestsPicker — red/green TDD specs (LOC-1063).
 *
 * Critical invariants:
 * - Trigger shows total guest count with correct singular/plural
 * - Accordion toggles via aria-expanded
 * - Four categories visible when expanded
 * - +/- respects min/max and calls onChange with new value
 * - Unit hints from quote breakdown
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingGuestsPicker from "@/components/tours/booking-widget/BookingGuestsPicker";
import type { BookingWidgetQuote } from "@/types/bokun";

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [
    {
      categoryId: 1,
      categoryLabel: "Adult",
      count: 1,
      unitAmount: 248,
      lineTotal: 248,
      currency: "EUR",
    },
  ],
};

const defaultParticipants = {
  adults: 1,
  youth: 0,
  children: 0,
  infants: 0,
};

describe("BookingGuestsPicker", () => {
  it("trigger invariant: shows singular participant label for count of 1", () => {
    render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={vi.fn()}
        quote={null}
      />,
    );

    expect(screen.getByRole("button", { name: /1 participant/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("trigger invariant: shows plural participants label for count > 1", () => {
    render(
      <BookingGuestsPicker
        participants={{ adults: 2, youth: 1, children: 0, infants: 0 }}
        onChange={vi.fn()}
        quote={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: /3 participants/i }),
    ).toBeInTheDocument();
  });

  it("accordion invariant: expands to show four categories", () => {
    render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={vi.fn()}
        quote={sampleQuote}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /1 participant/i }));

    expect(screen.getByRole("button", { name: /1 participant/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Adults")).toBeInTheDocument();
    expect(screen.getByText("Youth")).toBeInTheDocument();
    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.getByText("Infants")).toBeInTheDocument();
    expect(screen.getByText(/18\+ · €248/)).toBeInTheDocument();
  });

  it("stepper invariant: increase calls onChange with incremented adults", () => {
    const onChange = vi.fn();
    render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={onChange}
        quote={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /1 participant/i }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Adults" }));

    expect(onChange).toHaveBeenCalledWith("adults", 2);
  });

  it("stepper invariant: decrease is disabled at category minimum", () => {
    render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={vi.fn()}
        quote={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /1 participant/i }));

    expect(
      screen.getByRole("button", { name: "Decrease Youth" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Decrease Adults" }),
    ).toBeEnabled();
  });

  it("stepper invariant: does not decrease below minimum", () => {
    const onChange = vi.fn();
    render(
      <BookingGuestsPicker
        participants={{ adults: 0, youth: 0, children: 0, infants: 0 }}
        onChange={onChange}
        quote={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /0 participants/i }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease Adults" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disabled invariant: prevents accordion expand and stepper interaction", () => {
    const onChange = vi.fn();
    render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={onChange}
        quote={null}
        disabled
      />,
    );

    const trigger = screen.getByRole("button", { name: /1 participant/i });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Adults")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    cleanup();

    const onChangeWhileOpen = vi.fn();
    const { rerender } = render(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={onChangeWhileOpen}
        quote={null}
      />,
    );

    const openTrigger = screen.getByRole("button", { name: /1 participant/i });
    fireEvent.click(openTrigger);

    expect(openTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Adults")).toBeInTheDocument();

    rerender(
      <BookingGuestsPicker
        participants={defaultParticipants}
        onChange={onChangeWhileOpen}
        quote={null}
        disabled
      />,
    );

    expect(openTrigger).toBeDisabled();
    expect(openTrigger).toHaveAttribute("aria-disabled", "true");
    expect(openTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Adults")).not.toBeInTheDocument();
    expect(onChangeWhileOpen).not.toHaveBeenCalled();
  });
});
