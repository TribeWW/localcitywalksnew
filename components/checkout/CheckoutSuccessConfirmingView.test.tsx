/**
 * CheckoutSuccessConfirmingView — polling confirm state (LOC-1167).
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import {
  CHECKOUT_SUCCESS_CONFIRMING_MAX_POLLS,
  CHECKOUT_SUCCESS_CONFIRMING_POLL_MS,
  CHECKOUT_SUCCESS_CONFIRMING_RETRY_LABEL,
  CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_TITLE,
  CheckoutSuccessConfirmingView,
} from "@/components/checkout/CheckoutSuccessConfirmingView";
import { HELLO_PALMA_CHECKOUT_FIXTURE } from "@/components/checkout/checkout-mock-fixture";

function advanceConfirmingPolls(pollCount: number): void {
  act(() => {
    for (let index = 0; index < pollCount; index += 1) {
      vi.advanceTimersByTime(CHECKOUT_SUCCESS_CONFIRMING_POLL_MS);
    }
  });
}

describe("CheckoutSuccessConfirmingView", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows confirming copy and tour recap while fulfilment completes", () => {
    render(
      <CheckoutSuccessConfirmingView order={HELLO_PALMA_CHECKOUT_FIXTURE} />,
    );

    expect(screen.getByText("Confirming your booking…")).toBeInTheDocument();
    expect(
      screen.getByText(/Your payment was successful/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(HELLO_PALMA_CHECKOUT_FIXTURE.title),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Confirming your booking",
    );
  });

  it("shows static guidance and retry CTAs after polling times out", () => {
    vi.useFakeTimers();
    render(
      <CheckoutSuccessConfirmingView order={HELLO_PALMA_CHECKOUT_FIXTURE} />,
    );

    advanceConfirmingPolls(CHECKOUT_SUCCESS_CONFIRMING_MAX_POLLS + 1);

    expect(
      screen.getByText(CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_TITLE),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: CHECKOUT_SUCCESS_CONFIRMING_RETRY_LABEL,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse tours" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("restarts polling when the customer retries after a timeout", () => {
    vi.useFakeTimers();
    render(
      <CheckoutSuccessConfirmingView order={HELLO_PALMA_CHECKOUT_FIXTURE} />,
    );

    advanceConfirmingPolls(CHECKOUT_SUCCESS_CONFIRMING_MAX_POLLS + 1);

    refreshMock.mockClear();
    fireEvent.click(
      screen.getByRole("button", {
        name: CHECKOUT_SUCCESS_CONFIRMING_RETRY_LABEL,
      }),
    );

    expect(screen.getByText("Confirming your booking…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalledTimes(1);

    advanceConfirmingPolls(1);
    expect(refreshMock).toHaveBeenCalledTimes(2);
  });
});
