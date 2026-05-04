import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

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

describe("Navbar", () => {
  it("uses a safe browse route for the Browse tours CTA", () => {
    render(<Navbar />);

    const browseLinks = screen.getAllByRole("link", { name: "Browse tours" });
    expect(browseLinks.length).toBeGreaterThan(0);
    for (const link of browseLinks) {
      expect(link).toHaveAttribute("href", "/");
    }
  });
});
