/**
 * CheckoutSuccessConfirmingView — polling confirm state (LOC-1167).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { CheckoutSuccessConfirmingView } from "@/components/checkout/CheckoutSuccessConfirmingView";
import { HELLO_PALMA_CHECKOUT_FIXTURE } from "@/components/checkout/checkout-mock-fixture";

describe("CheckoutSuccessConfirmingView", () => {
  it("shows confirming copy and tour recap while fulfilment completes", () => {
    render(<CheckoutSuccessConfirmingView order={HELLO_PALMA_CHECKOUT_FIXTURE} />);

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
});
