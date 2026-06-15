/**
 * BookingWidget — red/green TDD specs (LOC-1048).
 *
 * Critical invariants:
 * - Four participant counters (includes infants); no static duration selector
 * - Availabilities fetched on mount for the current month
 * - Quote refetch is debounced (400ms) after date + startTimeId are set
 * - Submit stays disabled until consent + valid quote
 * - Slot `guidedLanguages` override product `languages` for the language control
 * - Below `minParticipantsToBookNow` blocks submit with inline message
 * - Pre-submit `BookingSubmitSummary` shows date, time, participants, and total (LOC-1054)
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { BokunAvailability, BookingWidgetQuote } from "@/types/bokun";

const getTourAvailabilitiesMock = vi.fn();
const getTourBookingQuoteMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/actions/booking-widget.actions", () => ({
  getTourAvailabilities: (...args: unknown[]) =>
    getTourAvailabilitiesMock(...args),
  getTourBookingQuote: (...args: unknown[]) => getTourBookingQuoteMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/components/ui/date-picker", () => ({
  default: ({
    onChange,
    disabled,
  }: {
    onChange: (date: Date | undefined) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      aria-label="Select a date"
      disabled={disabled}
      onClick={() => onChange(new Date(2026, 5, 15))}
    >
      Pick date
    </button>
  ),
}));

vi.mock("@/components/ui/time-selector", () => ({
  default: ({
    options = [],
    value,
    onChange,
    disabled,
  }: {
    options?: { value: string; label: string }[];
    value?: string;
    onChange: (value: string | undefined) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label="Start time"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value ? event.target.value : undefined)
      }
    >
      <option value="">Select time</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label="Tour language"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: ReactNode;
  }) => <option value={value}>{children}</option>,
}));

import BookingWidget from "@/components/tours/BookingWidget";

const SLOT_DATE_ISO = "2026-06-15";
const START_TIME_ID = 4252139;

function buildOpenSlot(
  overrides: Partial<BokunAvailability> = {},
): BokunAvailability {
  return {
    id: `${START_TIME_ID}_${SLOT_DATE_ISO.replace(/-/g, "")}`,
    activityId: 1079932,
    startTimeId: START_TIME_ID,
    startTime: "11:00",
    date: Date.parse(`${SLOT_DATE_ISO}T12:00:00.000Z`),
    pricesByRate: [],
    guidedLanguages: [],
    soldOut: false,
    ...overrides,
  };
}

const sampleQuote: BookingWidgetQuote = {
  totalAmount: 248,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

const defaultBootstrap = {
  productId: "1079932",
  productTitle: "Hello Biarritz",
  cityName: "Biarritz",
  startTimes: [{ id: START_TIME_ID, hour: 11, minute: 0 }],
  languages: ["EN_GB"],
  durationText: "2 hours",
};

async function flushAvailabilitiesLoad() {
  await waitFor(() => {
    expect(getTourAvailabilitiesMock).toHaveBeenCalled();
  });
  await waitFor(() => {
    expect(
      screen.queryByText(/Loading available dates/i),
    ).not.toBeInTheDocument();
  });
}

async function selectAvailableDate() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Select a date" }));
  });
}

describe("BookingWidget — structure invariants", () => {
  beforeEach(() => {
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [buildOpenSlot()],
    });
    getTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
  });

  it("participant invariant: renders four counters including infants", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.getByText("Adults (18+)")).toBeInTheDocument();
    expect(screen.getByText("Youth (13-17)")).toBeInTheDocument();
    expect(screen.getByText("Children (3-12)")).toBeInTheDocument();
    expect(screen.getByText("Infants (0-2)")).toBeInTheDocument();
  });

  it("duration invariant: shows read-only durationText, not a duration selector", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.getByText(/Duration:/)).toHaveTextContent("2 hours");
    expect(screen.queryByText("Tour Duration")).not.toBeInTheDocument();
  });
});

describe("BookingWidget — availability and quote invariants", () => {
  beforeEach(() => {
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [buildOpenSlot()],
    });
    getTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
  });

  it("availability invariant: fetches current month on mount", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(getTourAvailabilitiesMock).toHaveBeenCalledWith(
      "1079932",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("debounce invariant: delays quote fetch until ~400ms after slot selection", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    getTourBookingQuoteMock.mockClear();
    await selectAvailableDate();

    expect(getTourBookingQuoteMock).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getTourBookingQuoteMock).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(getTourBookingQuoteMock).toHaveBeenCalledWith(
          expect.objectContaining({
            productId: "1079932",
            date: SLOT_DATE_ISO,
            startTimeId: START_TIME_ID,
            participants: { adults: 1, youth: 0, children: 0, infants: 0 },
            currency: "EUR",
          }),
        );
      },
      { timeout: 800 },
    );
  });

  it("submit gating invariant: disables send until consent and quote are ready", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    const submitButton = screen.getByRole("button", { name: "Send request" });
    expect(submitButton).toBeDisabled();

    await selectAvailableDate();

    await waitFor(() => {
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });

    expect(submitButton).toBeEnabled();
  });

  it("pre-submit summary invariant: shows booking review above submit when quote is ready", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.queryByLabelText("Booking summary")).not.toBeInTheDocument();

    await selectAvailableDate();

    await waitFor(() => {
      expect(screen.getByLabelText("Booking summary")).toBeInTheDocument();
    });

    const summary = screen.getByLabelText("Booking summary");
    expect(summary).toHaveTextContent("Your booking");
    expect(summary).toHaveTextContent("11:00");
    expect(summary).toHaveTextContent("1 adult");
    expect(summary).toHaveTextContent("English");
    expect(summary).toHaveTextContent("€248");
  });
});

describe("BookingWidget — slot-driven invariants", () => {
  beforeEach(() => {
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [
        buildOpenSlot({
          guidedLanguages: ["FR"],
          minParticipantsToBookNow: 4,
        }),
      ],
    });
    getTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
  });

  it("language invariant: prefers slot guidedLanguages over product languages", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    await selectAvailableDate();

    expect(screen.getByRole("option", { name: "French" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "English" }),
    ).not.toBeInTheDocument();
  });

  it("minParticipants invariant: blocks submit when below minParticipantsToBookNow", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    await selectAvailableDate();

    await waitFor(() => {
      expect(
        screen.getByText(/requires at least 4 participants/i),
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });

    expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
  });
});
