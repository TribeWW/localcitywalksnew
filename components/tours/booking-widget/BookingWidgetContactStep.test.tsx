/**
 * BookingWidgetContactStep — red/green TDD specs (LOC-1063).
 *
 * Critical invariants:
 * - Back link returns to step 1 via onBack
 * - Contact fields: full name, email, optional phone/message
 * - Price recap without empty prompt
 * - Consent checkbox required for submit enablement
 * - Send request is type submit and respects canSubmit
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import BookingWidgetContactStep, {
  type BookingWidgetContactFormValues,
} from "@/components/tours/booking-widget/BookingWidgetContactStep";
import { Form } from "@/components/ui/form";
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

function ContactStepHarness({
  canSubmit = false,
  quote = sampleQuote,
  quoteLoading = false,
  quoteError = null,
  onBack = vi.fn(),
}: {
  canSubmit?: boolean;
  quote?: BookingWidgetQuote | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
  onBack?: () => void;
}) {
  const form = useForm<BookingWidgetContactFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      message: "",
      consent: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={vi.fn()}>
        <BookingWidgetContactStep
          control={
            form.control as unknown as Control<FieldValues>
          }
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          canSubmit={canSubmit}
          onBack={onBack}
        />
      </form>
    </Form>
  );
}

describe("BookingWidgetContactStep", () => {
  it("renders back link and contact field placeholders", () => {
    render(<ContactStepHarness />);

    expect(
      screen.getByRole("button", { name: "← Back to booking details" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Phone number (optional)"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Message (optional)")).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<ContactStepHarness onBack={onBack} />);

    fireEvent.click(
      screen.getByRole("button", { name: "← Back to booking details" }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("recap invariant: shows quote total without empty prompt", () => {
    render(<ContactStepHarness quote={sampleQuote} />);

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("€248")).toHaveLength(2);
    expect(
      screen.queryByText(
        "Select participants, date, and time to see your total price.",
      ),
    ).not.toBeInTheDocument();
  });

  it("submit invariant: disables Send request when canSubmit is false", () => {
    render(<ContactStepHarness canSubmit={false} />);

    expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
  });

  it("submit invariant: enables Send request when canSubmit is true", () => {
    render(<ContactStepHarness canSubmit />);

    expect(screen.getByRole("button", { name: "Send request" })).toBeEnabled();
  });

  it("consent invariant: renders consent label copy", () => {
    render(<ContactStepHarness />);

    expect(
      screen.getByText(
        /I agree that LocalCityWalks may use my details to respond to my tour request/i,
      ),
    ).toBeInTheDocument();
  });
});
