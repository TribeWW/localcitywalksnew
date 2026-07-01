/**
 * CheckoutPaymentSection — terms gate invariants (LOC-1150).
 *
 * Critical invariants:
 * - Pay CTA disabled until terms accepted
 * - Terms checkbox is required for accessibility
 * - Pay click only fires when terms accepted and not loading
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPaymentSection } from "@/components/checkout/CheckoutPaymentSection";

function PaymentSectionHarness({
  onPayClick,
  initialTermsAccepted = false,
  payLoading = false,
}: {
  onPayClick: () => void;
  initialTermsAccepted?: boolean;
  payLoading?: boolean;
}) {
  const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);

  return (
    <CheckoutPaymentSection
      payLabel="Pay €496"
      termsAccepted={termsAccepted}
      onTermsAcceptedChange={setTermsAccepted}
      onPayClick={onPayClick}
      payLoading={payLoading}
    />
  );
}

describe("CheckoutPaymentSection — terms required state", () => {
  it("disables Pay until terms checkbox is accepted", () => {
    const onPayClick = vi.fn();
    render(<PaymentSectionHarness onPayClick={onPayClick} />);

    const payButton = screen.getByRole("button", { name: "Pay €496" });
    expect(payButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(payButton).toBeEnabled();
  });

  it("marks terms checkbox as required", () => {
    render(
      <CheckoutPaymentSection
        payLabel="Pay €496"
        termsAccepted={false}
        onTermsAcceptedChange={() => {}}
        onPayClick={() => {}}
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-required", "true");
  });

  it("does not call onPayClick when Pay is disabled", () => {
    const onPayClick = vi.fn();
    render(
      <CheckoutPaymentSection
        payLabel="Pay €496"
        termsAccepted={false}
        onTermsAcceptedChange={() => {}}
        onPayClick={onPayClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pay €496" }));
    expect(onPayClick).not.toHaveBeenCalled();
  });

  it("calls onPayClick when terms accepted and Pay is clicked", () => {
    const onPayClick = vi.fn();
    render(<PaymentSectionHarness onPayClick={onPayClick} initialTermsAccepted />);

    fireEvent.click(screen.getByRole("button", { name: "Pay €496" }));
    expect(onPayClick).toHaveBeenCalledTimes(1);
  });

  it("keeps Pay disabled while payLoading even when terms accepted", () => {
    const onPayClick = vi.fn();
    render(
      <PaymentSectionHarness
        onPayClick={onPayClick}
        initialTermsAccepted
        payLoading
      />,
    );

    expect(screen.getByRole("button", { name: "Pay €496" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pay €496" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(onPayClick).not.toHaveBeenCalled();
  });
});
