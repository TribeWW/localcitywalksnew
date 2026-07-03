/**
 * CheckoutPriceUpdatedBanner — red/green TDD specs (LOC-1156).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPriceUpdatedBanner } from "@/components/checkout/CheckoutPriceUpdatedBanner";

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

describe("CheckoutPriceUpdatedBanner", () => {
  it("shows price-change alert with formatted totals and tour return link", () => {
    render(
      <CheckoutPriceUpdatedBanner
        priceUpdate={priceUpdate}
        tourPageHref="/tours/biarritz/hello-biarritz-1079932"
        acknowledged={false}
        onAcknowledgedChange={() => {}}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/€448/)).toBeInTheDocument();
    expect(screen.getByText(/€496/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to tour/i })).toHaveAttribute(
      "href",
      "/tours/biarritz/hello-biarritz-1079932",
    );
  });

  it("calls onAcknowledgedChange when the customer accepts the new total", () => {
    const onAcknowledgedChange = vi.fn();
    render(
      <CheckoutPriceUpdatedBanner
        priceUpdate={priceUpdate}
        tourPageHref="/tours/biarritz/hello-biarritz-1079932"
        acknowledged={false}
        onAcknowledgedChange={onAcknowledgedChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /accept the updated total/i }),
    );
    expect(onAcknowledgedChange).toHaveBeenCalledWith(true);
  });
});
