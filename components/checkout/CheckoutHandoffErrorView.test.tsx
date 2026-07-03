/**
 * CheckoutHandoffErrorView — error state UI specs (LOC-1155).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutHandoffErrorView } from "@/components/checkout/CheckoutHandoffErrorView";

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

describe("CheckoutHandoffErrorView", () => {
  it("renders sold-out heading and return CTA with tour href", () => {
    render(
      <CheckoutHandoffErrorView
        title="Time slot unavailable"
        message="This time slot is no longer available."
        tourPageHref="/tours/biarritz/hello-biarritz-1079932"
      />,
    );

    expect(screen.getByRole("heading", { name: "Time slot unavailable" })).toBeInTheDocument();
    expect(screen.getByText("This time slot is no longer available.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to tour" })).toHaveAttribute(
      "href",
      "/tours/biarritz/hello-biarritz-1079932",
    );
  });

  it("defaults to checkout unavailable heading when title is omitted", () => {
    render(
      <CheckoutHandoffErrorView
        message="This checkout link isn't valid."
        tourPageHref="/explore"
      />,
    );

    expect(screen.getByRole("heading", { name: "Checkout unavailable" })).toBeInTheDocument();
  });
});
