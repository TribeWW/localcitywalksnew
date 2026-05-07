import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FooterCityLinksView } from "./FooterCityLinksView";

describe("FooterCityLinksView", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(<FooterCityLinksView items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one link per item with correct hrefs", () => {
    render(
      <FooterCityLinksView
        items={[
          { name: "Paris", href: "/tours/paris" },
          { name: "Berlin", href: "/tours/berlin" },
        ]}
      />,
    );

    const paris = screen.getByRole("link", { name: "Paris" });
    const berlin = screen.getByRole("link", { name: "Berlin" });
    expect(paris).toHaveAttribute("href", "/tours/paris");
    expect(berlin).toHaveAttribute("href", "/tours/berlin");
  });

  it("renders middot separators only between links", () => {
    render(
      <FooterCityLinksView
        items={[
          { name: "A", href: "/tours/a" },
          { name: "B", href: "/tours/b" },
          { name: "C", href: "/tours/c" },
        ]}
      />,
    );

    expect(screen.getAllByText("·")).toHaveLength(2);
  });

  it("renders no separators for a single link", () => {
    render(<FooterCityLinksView items={[{ name: "Paris", href: "/tours/paris" }]} />);
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });
});
