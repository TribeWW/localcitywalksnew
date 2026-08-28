/**
 * BookingWidget — red/green TDD specs (LOC-1048 / LOC-1063).
 *
 * Critical invariants:
 * - Full configuring form visible on mount with checkout handoff (LOC-1157)
 * - Guests accordion with four participant categories; defaults to 2 adults
 * - Availabilities fetched on mount for the current month
 * - Quote refetch is debounced (400ms) after date + startTimeId are set
 * - Continue to checkout calls `startCheckoutHandoff` and redirects
 * - Slot `guidedLanguages` narrow product `guidanceTypes` options
 * - Below `minParticipantsToBookNow` blocks Continue to checkout with inline message
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
const startCheckoutHandoffMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
const locationAssignMock = vi.fn();

vi.mock("@/lib/booking/widget.actions", () => ({
  getTourAvailabilities: (...args: unknown[]) =>
    getTourAvailabilitiesMock(...args),
  getTourBookingQuote: (...args: unknown[]) => getTourBookingQuoteMock(...args),
}));

vi.mock("@/lib/checkout/handoff.actions", () => ({
  startCheckoutHandoff: (...args: unknown[]) =>
    startCheckoutHandoffMock(...args),
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
import { BOOKING_WIDGET_MD_MEDIA_QUERY } from "@/components/tours/booking-widget/use-is-medium-screen";

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
    defaultRateId: 2116654,
    rates: [{ id: 2116654, minPerBooking: 1, maxPerBooking: 15 }],
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
      count: 2,
      unitAmount: 124,
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
  guidedLanguageOptions: [
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
  ],
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

async function selectAvailableDate() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Select a date" }));
  });
}

async function selectLanguage(code: string) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Tour language"), {
      target: { value: code },
    });
  });
}

async function waitForQuoteTotal() {
  await waitFor(() => {
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("€248.00").length).toBeGreaterThan(0);
  });
}

async function completeStep1WithQuote() {
  await selectAvailableDate();
  await selectLanguage("en");
  await waitForQuoteTotal();
}

/**
 * Mocks `window.matchMedia` for layout branching (`md` breakpoint).
 *
 * @param matches - `true` for md+ (in-page widget); `false` for small screens
 */
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === BOOKING_WIDGET_MD_MEDIA_QUERY ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value,
  });
  window.dispatchEvent(new Event("scroll"));
}

describe("BookingWidget — structure invariants", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    setScrollY(0);
    document.body.style.overflow = "unset";
    locationAssignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [buildOpenSlot()],
    });
    getTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
  });

  it("shows configuring form on mount with from price and checkout CTA", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("€124.00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select a date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /2 participants/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free cancellation")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check availability" }),
    ).not.toBeInTheDocument();
  });

  it("participant invariant: guests accordion lists four categories", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();
    await selectLanguage("en");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /2 participants/i }));
    });

    expect(screen.getByText("Adults")).toBeInTheDocument();
    expect(screen.getByText("Youth")).toBeInTheDocument();
    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.getByText("Infants")).toBeInTheDocument();
  });

  it("language invariant: disables guests picker until a language is selected", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();

    const guestsTrigger = screen.getByRole("button", { name: /2 participants/i });
    expect(guestsTrigger).toBeDisabled();
    expect(guestsTrigger).toHaveAttribute("aria-disabled", "true");

    await selectLanguage("en");

    await waitFor(() => {
      expect(guestsTrigger).toBeEnabled();
    });
  });

  it("does not show legacy duration copy in the widget", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
  });
});

describe("BookingWidget — availability and quote invariants", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    setScrollY(0);
    locationAssignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
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

  it("debounce invariant: delays quote fetch until ~400ms after language selection", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    getTourBookingQuoteMock.mockClear();
    await selectAvailableDate();

    expect(getTourBookingQuoteMock).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getTourBookingQuoteMock).not.toHaveBeenCalled();

    await selectLanguage("en");

    await waitFor(
      () => {
        expect(getTourBookingQuoteMock).toHaveBeenCalledWith(
          expect.objectContaining({
            productId: "1079932",
            date: SLOT_DATE_ISO,
            startTimeId: START_TIME_ID,
            language: "en",
            participants: { adults: 2, youth: 0, children: 0, infants: 0 },
            currency: "EUR",
          }),
        );
      },
      { timeout: 800 },
    );
  });

  it("checkout invariant: disables Continue to checkout until quote is ready", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();

    const checkoutButton = screen.getByRole("button", {
      name: "Continue to checkout",
    });
    expect(checkoutButton).toBeDisabled();

    await selectLanguage("en");
    await waitForQuoteTotal();
    expect(checkoutButton).toBeEnabled();
  });

  it("checkout invariant: calls startCheckoutHandoff and redirects on success", async () => {
    startCheckoutHandoffMock.mockResolvedValue({
      success: true,
      redirectUrl: "/checkout?h=signed.token",
    });

    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await completeStep1WithQuote();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Continue to checkout" }),
      );
    });

    await waitFor(() => {
      expect(startCheckoutHandoffMock).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "1079932",
          productTitle: "Hello Biarritz",
          date: SLOT_DATE_ISO,
          startTimeId: START_TIME_ID,
          participants: { adults: 2, youth: 0, children: 0, infants: 0 },
          clientQuote: { totalAmount: 248, currency: "EUR" },
        }),
      );
    });

    expect(locationAssignMock).toHaveBeenCalledWith("/checkout?h=signed.token");
  });

  it("checkout invariant: surfaces server error toast on handoff failure", async () => {
    startCheckoutHandoffMock.mockResolvedValue({
      success: false,
      error: "Price has changed. Please review your total and try again.",
    });

    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await completeStep1WithQuote();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Continue to checkout" }),
      );
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Price has changed. Please review your total and try again.",
      );
    });
    expect(locationAssignMock).not.toHaveBeenCalled();
  });

  it("step 1 shows price recap in the breakdown", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await completeStep1WithQuote();

    expect(screen.getByText("Adult × 2")).toBeInTheDocument();
    expect(screen.getAllByText("€248.00").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Price includes taxes and fees"),
    ).toBeInTheDocument();
  });
});

describe("BookingWidget — slot-driven invariants", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    setScrollY(0);
    locationAssignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
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

  it("language invariant: narrows to slot guidedLanguages when set", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();

    expect(screen.getByRole("option", { name: "French" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "English" }),
    ).not.toBeInTheDocument();
  });

  it("language invariant: blocks quote until a language valid for the slot is selected", async () => {
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [
        buildOpenSlot({
          guidedLanguages: ["FR", "es"],
        }),
      ],
    });
    getTourBookingQuoteMock.mockClear();

    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();

    const guestsTrigger = screen.getByRole("button", { name: /2 participants/i });
    expect(guestsTrigger).toBeDisabled();
    expect(getTourBookingQuoteMock).not.toHaveBeenCalled();

    await selectLanguage("FR");

    await waitFor(() => {
      expect(guestsTrigger).toBeEnabled();
    });

    await waitFor(
      () => {
        expect(getTourBookingQuoteMock).toHaveBeenCalledWith(
          expect.objectContaining({ language: "FR" }),
        );
      },
      { timeout: 800 },
    );
  });

  it("minParticipants invariant: blocks Continue to checkout when below minParticipantsToBookNow", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();
    await selectAvailableDate();
    await selectLanguage("FR");

    await waitFor(() => {
      expect(
        screen.getByText(/requires at least 4 participants/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeDisabled();
  });
});

describe("BookingWidget — small-screen mobile chrome", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    setScrollY(0);
    document.body.style.overflow = "unset";
    locationAssignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
    getTourAvailabilitiesMock.mockResolvedValue({
      success: true,
      data: [buildOpenSlot()],
    });
    getTourBookingQuoteMock.mockResolvedValue({
      success: true,
      data: sampleQuote,
    });
  });

  it("does not render in-page configure form on small screens", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    expect(
      screen.queryByRole("button", { name: "Select a date" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue to checkout" }),
    ).not.toBeInTheDocument();
  });

  it("hides mobile bar before scroll threshold and shows it after 240px", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    const bar = screen.getByTestId("booking-mobile-bar");
    expect(bar).toHaveClass("translate-y-full");
    expect(bar).toHaveClass("opacity-0");

    await act(async () => {
      setScrollY(241);
    });

    expect(bar).toHaveClass("translate-y-0");
    expect(bar).toHaveClass("opacity-100");
  });

  it("opens configure drawer when Check availability is tapped", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    await act(async () => {
      setScrollY(300);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Check availability" }),
      );
    });

    expect(screen.getByTestId("booking-mobile-drawer")).toBeInTheDocument();
    expect(screen.getByText("Select dates & guests")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select a date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to checkout" }),
    ).toBeInTheDocument();
  });

  it("closes drawer and restores body scroll on dismiss", async () => {
    render(<BookingWidget {...defaultBootstrap} />);
    await flushAvailabilitiesLoad();

    await act(async () => {
      setScrollY(300);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Check availability" }),
      );
    });

    expect(document.body.style.overflow).toBe("hidden");

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(screen.queryByTestId("booking-mobile-drawer")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("unset");
  });
});
