/**
 * CheckoutSummaryView — promo code UI wiring (LOC-1232 / LOC-1235).
 *
 * Critical invariants:
 * - Promo input is hidden when the feature flag prop is off
 * - Applied promo updates Pay label + order summary total
 * - Removing the promo restores the original total / Pay label
 * - Pay cannot start while promo validation is still pending
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
import { HELLO_PALMA_CHECKOUT_FIXTURE } from "@/components/checkout/checkout-mock-fixture";

const validatePromoCodeMock = vi.fn();
const runCheckoutPayClickMock = vi.fn();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/checkout/payment.actions", () => ({
  initiateCheckoutPayment: vi.fn(),
}));

vi.mock("@/lib/checkout/promo-code.actions", () => ({
  validatePromoCode: (...args: unknown[]) => validatePromoCodeMock(...args),
}));

vi.mock("@/lib/checkout/run-checkout-pay-click", () => ({
  runCheckoutPayClick: (...args: unknown[]) => runCheckoutPayClickMock(...args),
}));

describe("CheckoutSummaryView — promo code UI", () => {
  beforeEach(() => {
    validatePromoCodeMock.mockReset();
    runCheckoutPayClickMock.mockReset();
  });

  it("does not render the promo input when promoCodeEnabled is false", () => {
    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        promoCodeEnabled={false}
      />,
    );

    expect(
      screen.queryByPlaceholderText(/promo or gift code/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay €496.00/ })).toBeInTheDocument();
  });

  it("updates the total and Pay label when a valid promo is applied", async () => {
    validatePromoCodeMock.mockResolvedValue({
      success: true,
      data: {
        valid: true,
        originalAmount: 496,
        discountedAmount: 396,
        discountAmount: 100,
        currency: "EUR",
      },
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken="signed.handoff.token"
        promoCodeEnabled
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    });

    expect(validatePromoCodeMock).toHaveBeenCalledWith({
      handoffToken: "signed.handoff.token",
      promoCode: "SUMMER20",
    });
    expect(screen.getByRole("button", { name: /Pay €396.00/ })).toBeInTheDocument();
    expect(screen.getByText("Total").parentElement).toHaveTextContent("€396.00");
  });

  it("restores the original total and Pay label when the promo is removed", async () => {
    validatePromoCodeMock.mockResolvedValue({
      success: true,
      data: {
        valid: true,
        originalAmount: 496,
        discountedAmount: 396,
        discountAmount: 100,
        currency: "EUR",
      },
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken="signed.handoff.token"
        promoCodeEnabled
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/remove promo code/i));

    expect(screen.getByRole("button", { name: /Pay €496.00/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/promo or gift code/i),
    ).toBeInTheDocument();
  });

  it("shows invalid/expired copy when Bókun options reject the promo", async () => {
    validatePromoCodeMock.mockResolvedValue({
      success: false,
      error: "invalid_promo_code",
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken="signed.handoff.token"
        promoCodeEnabled
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "BADCODE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/this code is invalid or has expired/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/unable to verify this code right now/i),
    ).not.toBeInTheDocument();
  });

  it("shows retry copy only for clear infra validation failures", async () => {
    validatePromoCodeMock.mockResolvedValue({
      success: false,
      error: "unavailable",
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken="signed.handoff.token"
        promoCodeEnabled
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/unable to verify this code right now/i),
      ).toBeInTheDocument();
    });
  });

  it("does not invoke payment while promo validation is still pending", async () => {
    let resolveValidate: ((value: unknown) => void) | undefined;
    validatePromoCodeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveValidate = resolve;
        }),
    );

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken="signed.handoff.token"
        promoCodeEnabled
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "Ada" },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Lovelace" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "ada@example.com" },
      });
      fireEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    });

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /applying/i })).toBeDisabled();
    });

    const payButton = screen.getByRole("button", { name: /Pay €496.00/ });
    expect(payButton).toBeDisabled();

    fireEvent.click(payButton);
    expect(runCheckoutPayClickMock).not.toHaveBeenCalled();

    resolveValidate?.({
      success: true,
      data: {
        valid: true,
        originalAmount: 496,
        discountedAmount: 396,
        discountAmount: 100,
        currency: "EUR",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    });
  });
});
