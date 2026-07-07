/**
 * CheckoutPaymentCancelledBanner — Stripe cancel return UX (LOC-1163).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutPaymentCancelledBanner } from "@/components/checkout/CheckoutPaymentCancelledBanner";

describe("CheckoutPaymentCancelledBanner", () => {
  it("renders payment cancelled guidance as an alert", () => {
    render(<CheckoutPaymentCancelledBanner />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Your payment was cancelled/i,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /try again when you are ready/i,
    );
  });
});
