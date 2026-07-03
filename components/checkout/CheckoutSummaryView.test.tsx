/**
 * CheckoutSummaryView — price-updated banner gate (LOC-1156).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutSummaryView } from "@/components/checkout/CheckoutSummaryView";
import { HELLO_PALMA_CHECKOUT_FIXTURE } from "@/components/checkout/checkout-mock-fixture";

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

const priceUpdate = {
  previousTotalAmount: 448,
  previousCurrency: "EUR",
  currentTotalAmount: 496,
  currentCurrency: "EUR",
};

describe("CheckoutSummaryView — price updated banner", () => {
  it("blocks Pay until the customer accepts the updated total and terms", () => {
    const onPayClick = vi.fn();
    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        priceUpdate={priceUpdate}
        tourPageHref="/tours/palma/hello-palma-123"
        onPayClick={onPayClick}
      />,
    );

    const payButton = screen.getByRole("button", { name: /Pay €496/ });
    expect(payButton).toBeDisabled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /accept the updated total/i }),
    );
    expect(payButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    expect(payButton).toBeEnabled();

    fireEvent.click(payButton);
    expect(onPayClick).toHaveBeenCalledTimes(1);
  });

  it("does not show the banner when priceUpdate is null", () => {
    render(
      <CheckoutSummaryView
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        priceUpdate={null}
        tourPageHref="/tours/palma/hello-palma-123"
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
