/**
 * BookingWidget — red/green TDD specs (LOC-1048 / LOC-1063).
 *
 * Critical invariants:
 * - Guests accordion with four participant categories
 * - Collapsed → configuring → contact two-step flow
 * - Availabilities fetched on mount for the current month
 * - Quote refetch is debounced (400ms) after date + startTimeId are set
 * - Submit stays disabled until step 2 consent + valid quote + contact fields
 * - Slot `guidedLanguages` override product `languages` for the language control
 * - Below `minParticipantsToBookNow` blocks Book now with inline message
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { BokunAvailability, BookingWidgetQuote } from "@/types/bokun";

const getTourAvailabilitiesMock = vi.fn();
const getTourBookingQuoteMock = vi.fn();
const submitTourBookingRequestMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@/lib/actions/booking-widget.actions", () => ({
  getTourAvailabilities: (...args: unknown[]) =>
    getTourAvailabilitiesMock(...args),
  getTourBookingQuote: (...args: unknown[]) => getTourBookingQuoteMock(...args),
  submitTourBookingRequest: (...args: unknown[]) =>
    submitTourBookingRequestMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
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
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
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

const defaultBootstrap = {
  productId: "1079932",
  productTitle: "Hello Biarritz",
  cityName: "Biarritz",
  startTimes: [{ id: START_TIME_ID, hour: 11, minute: 0 }],
  languages: ["EN_GB"],
  fromPriceAmount: 124,
  fromPriceCurrency: "EUR",
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

async function openConfiguringStep() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Check availability" }));
  });
}

async function selectAvailableDate() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Select a date" }));
  });
}

async function waitForQuoteTotal() {
  await waitFor(() => {
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("€248").length).toBeGreaterThan(0);
  });
}

async function goToContactStep() {
  await openConfiguringStep();
  await selectAvailableDate();
  await waitForQuoteTotal();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Book now" }));
  });
}

async function fillContactFields() {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText("Full name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
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

  it("shows collapsed state with from price and check availability", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("€124")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check availability" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
  });

  it("participant invariant: guests accordion lists four categories", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await openConfiguringStep();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /1 participant/i }));
    });

    expect(screen.getByText("Adults")).toBeInTheDocument();
    expect(screen.getByText("Youth")).toBeInTheDocument();
    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.getByText("Infants")).toBeInTheDocument();
  });

  it("does not show legacy duration copy in the widget", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await openConfiguringStep();

    expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
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
    await openConfiguringStep();

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

  it("submit gating invariant: disables send until step 2 consent and quote are ready", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await goToContactStep();

    const submitButton = screen.getByRole("button", { name: "Send request" });
    expect(submitButton).toBeDisabled();

    await fillContactFields();

    expect(submitButton).toBeEnabled();
  });

  it("submit invariant: calls submitTourBookingRequest and shows success toast", async () => {
    submitTourBookingRequestMock.mockResolvedValue({ success: true });

    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await goToContactStep();
    await fillContactFields();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    });

    await waitFor(() => {
      expect(submitTourBookingRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Jane Doe",
          email: "jane@example.com",
          productId: "1079932",
          productTitle: "Hello Biarritz",
          date: SLOT_DATE_ISO,
          startTimeId: START_TIME_ID,
          participants: { adults: 1, youth: 0, children: 0, infants: 0 },
          clientQuote: { totalAmount: 248, currency: "EUR" },
          consent: true,
        }),
      );
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Tour request sent successfully! We'll get back to you soon.",
    );
  });

  it("submit invariant: surfaces server error toast on failure", async () => {
    submitTourBookingRequestMock.mockResolvedValue({
      success: false,
      error: "Price has changed. Please review your total and try again.",
    });

    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await goToContactStep();
    await fillContactFields();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Price has changed. Please review your total and try again.",
      );
    });
  });

  it("step 2 shows price recap below contact fields", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await goToContactStep();

    expect(screen.getByText("Adult × 1")).toBeInTheDocument();
    expect(screen.getAllByText("€248").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Price includes taxes and fees"),
    ).toBeInTheDocument();
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
    await openConfiguringStep();
    await selectAvailableDate();

    expect(screen.getByRole("option", { name: "French" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "English" }),
    ).not.toBeInTheDocument();
  });

  it("minParticipants invariant: blocks Book now when below minParticipantsToBookNow", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await openConfiguringStep();
    await selectAvailableDate();

    await waitFor(() => {
      expect(
        screen.getByText(/requires at least 4 participants/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Book now" })).toBeDisabled();
  });
});
