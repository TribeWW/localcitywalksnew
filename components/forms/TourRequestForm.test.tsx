/**
 * TourRequestForm — step navigation and consent gate.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TourRequestForm from "@/components/forms/TourRequestForm";

vi.mock("@/lib/nodemailer", () => ({
  sendTourRequestEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/components/ui/date-picker", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      aria-label={placeholder ?? "Select a date"}
      onClick={() => onChange(new Date(Date.now() + 86400000))}
    >
      {value ? value.toDateString() : placeholder ?? "Select a date"}
    </button>
  ),
}));

vi.mock("@/components/ui/time-selector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (time: string | undefined) => void;
  }) => (
    <select
      aria-label="Preferred time"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select time</option>
      <option value="11:00 AM">11:00 AM</option>
    </select>
  ),
}));

vi.mock("@/components/ui/duration-selector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (duration: string | undefined) => void;
  }) => (
    <select
      aria-label="Tour duration"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select duration</option>
      <option value="2 hours">2 hours</option>
    </select>
  ),
}));

vi.mock("@/components/forms/TourRequestLanguageSelector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (language: string | undefined) => void;
  }) => (
    <select
      aria-label="Language"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="English">English</option>
      <option value="Other">Other</option>
    </select>
  ),
}));

vi.mock("@/components/tours/booking-widget/BookingGuestsPicker", () => ({
  default: () => <div data-testid="guests-picker" />,
}));

describe("TourRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows step 1 heading initially", () => {
    render(
      <TourRequestForm lockCity initialCity="Barcelona" onClose={vi.fn()} />,
    );

    expect(screen.getByText("Customise your walk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("blocks step 2 when step 1 is incomplete", async () => {
    render(
      <TourRequestForm lockCity initialCity="Barcelona" onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Customise your walk")).toBeInTheDocument();
    });
    expect(screen.queryByText("How can we reach you?")).not.toBeInTheDocument();
  });

  it("advances to step 2 when step 1 is valid", async () => {
    render(
      <TourRequestForm lockCity initialCity="Barcelona" onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Select a date"));
    fireEvent.change(screen.getByLabelText("Preferred time"), {
      target: { value: "11:00 AM" },
    });
    fireEvent.change(screen.getByLabelText("Tour duration"), {
      target: { value: "2 hours" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Preferred route, interests, accessibility needs, anything else we should know...",
      ),
      {
        target: {
          value: "We would love a food-focused walk through the old town.",
        },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("How can we reach you?")).toBeInTheDocument();
    });
  });

  it("returns to step 1 from step 2 without losing step 1 values", async () => {
    render(
      <TourRequestForm lockCity initialCity="Barcelona" onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Select a date"));
    fireEvent.change(screen.getByLabelText("Preferred time"), {
      target: { value: "11:00 AM" },
    });
    fireEvent.change(screen.getByLabelText("Tour duration"), {
      target: { value: "2 hours" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Preferred route, interests, accessibility needs, anything else we should know...",
      ),
      {
        target: {
          value: "We would love a food-focused walk through the old town.",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("How can we reach you?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    await waitFor(() => {
      expect(screen.getByText("Customise your walk")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Select a date")).not.toHaveTextContent(
      "Select a date",
    );
  });

  it("shows consent error when submitting without agreement", async () => {
    render(
      <TourRequestForm lockCity initialCity="Barcelona" onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Select a date"));
    fireEvent.change(screen.getByLabelText("Preferred time"), {
      target: { value: "11:00 AM" },
    });
    fireEvent.change(screen.getByLabelText("Tour duration"), {
      target: { value: "2 hours" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Preferred route, interests, accessibility needs, anything else we should know...",
      ),
      {
        target: {
          value: "We would love a food-focused walk through the old town.",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("How can we reach you?")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: "Jane Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please agree before sending your request."),
      ).toBeInTheDocument();
    });
  });
});
