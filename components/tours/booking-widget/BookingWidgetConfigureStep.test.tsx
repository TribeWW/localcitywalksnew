/**
 * BookingWidgetConfigureStep — red/green TDD specs.
 *
 * Shared configure UI (date/time/language/guests/breakdown/footer) for the
 * md+ sticky card and the small-screen full-screen drawer.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BookingWidgetConfigureStep from "@/components/tours/booking-widget/BookingWidgetConfigureStep";
import { Form } from "@/components/ui/form";

vi.mock("@/components/ui/date-picker", () => ({
  default: () => <button type="button">Select a date</button>,
}));

vi.mock("@/components/ui/time-selector", () => ({
  default: () => <select aria-label="Start time" />,
}));

vi.mock("@/components/tours/LanguageSelector", () => ({
  default: () => <select aria-label="Tour language" />,
}));

const schema = z.object({
  adults: z.number(),
  youth: z.number(),
  children: z.number(),
  infants: z.number(),
  preferredDate: z.date().optional(),
  startTimeId: z.string().optional(),
  language: z.string().optional(),
});

function ConfigureStepHarness({
  showFromPrice = true,
}: {
  showFromPrice?: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      adults: 2,
      youth: 0,
      children: 0,
      infants: 0,
    },
  });

  return (
    <Form {...form}>
      <BookingWidgetConfigureStep
        showFromPrice={showFromPrice}
        fromPriceAmount={124}
        fromPriceCurrency="EUR"
        availError={null}
        availLoading={false}
        form={form}
        minDate={new Date()}
        maxDate={new Date()}
        isDateDisabled={() => false}
        preferredDate={undefined}
        timeOptions={[]}
        languageOptions={[]}
        participants={{ adults: 2, youth: 0, children: 0, infants: 0 }}
        onParticipantChange={vi.fn()}
        quote={null}
        quoteLoading={false}
        quoteError={null}
        isLanguageReady
        maxGroupSize={15}
        belowMinParticipants={false}
        minParticipantsRequired={1}
        canBookNow={false}
        continuingToCheckout={false}
        onContinueToCheckout={vi.fn()}
      />
    </Form>
  );
}

describe("BookingWidgetConfigureStep", () => {
  it("renders from-price when showFromPrice is true", () => {
    render(<ConfigureStepHarness showFromPrice />);

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("€124.00")).toBeInTheDocument();
  });

  it("omits from-price when showFromPrice is false", () => {
    render(<ConfigureStepHarness showFromPrice={false} />);

    expect(screen.queryByText("From")).not.toBeInTheDocument();
    expect(screen.queryByText("€124.00")).not.toBeInTheDocument();
  });

  it("renders configure field chrome and checkout footer", () => {
    render(<ConfigureStepHarness />);

    expect(screen.getByRole("button", { name: "Select a date" })).toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /2 participants/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
  });
});
