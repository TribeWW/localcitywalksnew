/**
 * CheckoutSummaryView — Pay CTA wiring (LOC-1162 / PRD Task 3.4).
 *
 * Critical invariants:
 * - Pay calls `runCheckoutPayClick` with contact + handoff token + client quote
 * - Pay is disabled while reserve / Stripe session creation is in flight
 * - Reserve sold-out errors surface via toast; success redirects to Stripe
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
import { HELLO_PALMA_CHECKOUT_FIXTURE } from "@/components/checkout/checkout-mock-fixture";
import { resolveCheckoutQuoteUnavailableMessage } from "@/lib/checkout/checkout-error-messages";

const runCheckoutPayClickMock = vi.fn();
const toastErrorMock = vi.fn();
const locationAssignMock = vi.fn();

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

vi.mock("@/lib/checkout/run-checkout-pay-click", () => ({
  runCheckoutPayClick: (...args: unknown[]) => runCheckoutPayClickMock(...args),
}));

vi.mock("@/lib/actions/checkout-payment.actions", () => ({
  initiateCheckoutPayment: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const HANDOFF_TOKEN = "signed.handoff.token";

async function fillContactFields() {
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
  });
}

async function acceptTermsAndPay() {
  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Pay €496/ }));
  });
}

describe("CheckoutSummaryView — Pay CTA", () => {
  beforeEach(() => {
    runCheckoutPayClickMock.mockReset();
    toastErrorMock.mockReset();
    locationAssignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: locationAssignMock },
    });
  });

  it("calls runCheckoutPayClick and redirects on success", async () => {
    runCheckoutPayClickMock.mockResolvedValue({
      type: "redirect",
      redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken={HANDOFF_TOKEN}
        tourPageHref="/tours/palma/hello-palma-123"
      />,
    );

    await fillContactFields();
    await acceptTermsAndPay();

    await waitFor(() => {
      expect(runCheckoutPayClickMock).toHaveBeenCalledWith(
        expect.any(Function),
        {
          handoffToken: HANDOFF_TOKEN,
          contact: {
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
          },
          termsAccepted: true,
          clientQuote: { totalAmount: 496, currency: "EUR" },
        },
      );
    });

    expect(locationAssignMock).toHaveBeenCalledWith(
      "https://checkout.stripe.com/c/pay/cs_test_123",
    );
  });

  it("keeps Pay disabled while payment initiation is in flight", async () => {
    let resolvePayment: (value: {
      type: "redirect";
      redirectUrl: string;
    }) => void = () => {};
    runCheckoutPayClickMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePayment = resolve;
        }),
    );

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken={HANDOFF_TOKEN}
        tourPageHref="/tours/palma/hello-palma-123"
      />,
    );

    await fillContactFields();
    fireEvent.click(screen.getByRole("checkbox", { name: /terms/i }));

    const payButton = screen.getByRole("button", { name: /Pay €496/ });
    await act(async () => {
      fireEvent.click(payButton);
    });

    expect(payButton).toBeDisabled();
    expect(payButton).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      resolvePayment({
        type: "redirect",
        redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
      });
    });

    await waitFor(() => {
      expect(payButton).not.toHaveAttribute("aria-busy", "true");
    });
  });

  it("surfaces sold-out reserve errors via toast", async () => {
    const soldOutMessage = resolveCheckoutQuoteUnavailableMessage("sold_out");
    runCheckoutPayClickMock.mockResolvedValue({
      type: "error",
      error: soldOutMessage,
    });

    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        handoffToken={HANDOFF_TOKEN}
        tourPageHref="/tours/palma/hello-palma-123"
      />,
    );

    await fillContactFields();
    await acceptTermsAndPay();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(soldOutMessage);
    });
    expect(locationAssignMock).not.toHaveBeenCalled();
  });

  it("still supports onPayClick when handoffToken is omitted (mock preview)", () => {
    const onPayClick = vi.fn();
    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        onPayClick={onPayClick}
        tourPageHref="/tours/palma/hello-palma-123"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    fireEvent.click(screen.getByRole("button", { name: /Pay €496/ }));
    expect(onPayClick).toHaveBeenCalledTimes(1);
    expect(runCheckoutPayClickMock).not.toHaveBeenCalled();
  });
});
