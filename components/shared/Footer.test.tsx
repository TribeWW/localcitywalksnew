import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string }) {
    return <span data-testid="footer-logo" aria-label={props.alt} />;
  },
}));

vi.mock("./FooterCityLinks", () => ({
  default: function FooterCityLinksPlaceholder() {
    return <div data-testid="footer-city-links-slot">city links</div>;
  },
}));

import Footer from "./Footer";

describe("Footer", () => {
  it("renders branding copy, includes the city links strip from Footer.tsx, and copyright", () => {
    render(<Footer />);

    expect(
      screen.getByText(/LocalCityWalks connects you with trusted local guides/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("footer-city-links-slot")).toHaveTextContent(
      "city links",
    );
    expect(screen.getByTestId("footer-logo")).toHaveAttribute(
      "aria-label",
      "LocalCityWalks",
    );
    expect(
      screen.getByText(
        new RegExp(`© ${new Date().getFullYear()} LocalCityWalks`),
      ),
    ).toBeInTheDocument();
  });

  it("renders only copyright and legal links in the minimal variant", () => {
    render(<Footer variant="minimal" />);

    expect(
      screen.queryByText(
        /LocalCityWalks connects you with trusted local guides/,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("footer-city-links-slot"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("footer-logo")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`© ${new Date().getFullYear()} LocalCityWalks`),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Terms and Conditions" }),
    ).toBeInTheDocument();
  });
});
