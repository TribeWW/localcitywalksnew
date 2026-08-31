/**
 * CheckoutPageLayout — mobile column order (order summary before form).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutPageLayout } from "@/components/checkout/CheckoutPageLayout";

describe("CheckoutPageLayout — column order", () => {
  it("places order summary before the form on mobile via CSS order", () => {
    render(
      <CheckoutPageLayout
        leftColumn={<div data-testid="checkout-form">Form</div>}
        rightColumn={<div data-testid="order-summary">Summary</div>}
      />,
    );

    const formColumn = screen.getByTestId("checkout-form").parentElement;
    const summaryColumn = screen.getByTestId("order-summary").parentElement;

    expect(formColumn).toHaveClass("order-2", "min-[960px]:order-1");
    expect(summaryColumn).toHaveClass("order-1", "min-[960px]:order-2");
  });
});
