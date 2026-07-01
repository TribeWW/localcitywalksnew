/**
 * OrderSummaryCard — display invariants (LOC-1150).
 *
 * Critical invariants:
 * - Total row shows formatted amount from server quote
 * - Tax-inclusive helper copy matches design brief
 * - Item count label reflects single-tour v1
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

describe("OrderSummaryCard — total row", () => {
  it("renders Total label, formatted amount, and tax helper", () => {
    render(
      <OrderSummaryCard itemCount={1} totalAmount={496} currency="EUR">
        <span>Tour line item</span>
      </OrderSummaryCard>,
    );

    expect(screen.getByRole("heading", { name: "Order summary" })).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("€496")).toBeInTheDocument();
    expect(
      screen.getByText("All taxes and fees included"),
    ).toBeInTheDocument();
  });

  it("pluralizes item count when more than one tour", () => {
    render(
      <OrderSummaryCard itemCount={2} totalAmount={694} currency="EUR">
        <span>Tour line item</span>
      </OrderSummaryCard>,
    );

    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("€694")).toBeInTheDocument();
  });
});
