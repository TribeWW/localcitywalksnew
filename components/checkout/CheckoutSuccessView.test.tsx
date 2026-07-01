/**
 * CheckoutSuccessView — booking reference display (LOC-1150).
 *
 * Critical invariants:
 * - Booking reference shown in summary card header
 * - Success hero and recap render for confirmed booking
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutSuccessView } from "@/components/checkout/CheckoutSuccessView";
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

describe("CheckoutSuccessView — reference display", () => {
  it("shows booking reference in the summary card header", () => {
    render(
      <CheckoutSuccessView
        bookingReference="LCW-2026-48291"
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        illustrationUrl="/hello-image.svg"
      />,
    );

    expect(screen.getByText("Ref: LCW-2026-48291")).toBeInTheDocument();
  });

  it("renders product title and total from order fixture", () => {
    render(
      <CheckoutSuccessView
        bookingReference="LOC-T383364"
        order={HELLO_PALMA_CHECKOUT_FIXTURE}
        illustrationUrl="/hello-image.svg"
      />,
    );

    expect(
      screen.getByText(HELLO_PALMA_CHECKOUT_FIXTURE.title),
    ).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("€496")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Take me home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
