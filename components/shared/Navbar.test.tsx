import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    children,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => <div>{children}</div>,
  SheetTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    void asChild;
    return <div>{children}</div>;
  },
  SheetContent: ({
    children,
  }: {
    children: React.ReactNode;
    side?: string;
    className?: string;
  }) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetClose: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    void asChild;
    return <div>{children}</div>;
  },
}));

vi.mock("lucide-react", () => ({
  HelpCircleIcon: () => <svg data-testid="help-icon" />,
  MailIcon: () => <svg data-testid="mail-icon" />,
  MenuIcon: () => <svg data-testid="menu-icon" />,
  XIcon: () => <svg data-testid="x-icon" />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

describe("Navbar", () => {
  it("renders Browse tours links pointing to /explore (not /#cities)", () => {
    render(<Navbar />);

    // All links with text "Browse tours" should point to /explore
    const browseLinks = screen.getAllByRole("link", { name: /browse tours/i });
    expect(browseLinks.length).toBeGreaterThan(0);
    browseLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/explore");
    });
  });

  it("does not have any Browse tours links pointing to /#cities", () => {
    render(<Navbar />);

    const allLinks = screen.getAllByRole("link");
    const citiesLinks = allLinks.filter(
      (link) => link.getAttribute("href") === "/#cities",
    );
    expect(citiesLinks).toHaveLength(0);
  });

  it("renders About us link pointing to /#about", () => {
    render(<Navbar />);

    const aboutLinks = screen.getAllByRole("link", { name: /about us/i });
    expect(aboutLinks.length).toBeGreaterThan(0);
    aboutLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/#about");
    });
  });

  it("renders Contact us link pointing to /#contact", () => {
    render(<Navbar />);

    const contactLinks = screen.getAllByRole("link", { name: /contact us/i });
    expect(contactLinks.length).toBeGreaterThan(0);
    contactLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/#contact");
    });
  });

  it("renders logo link pointing to home page", () => {
    render(<Navbar />);

    const logoLinks = screen.getAllByRole("link").filter(
      (link) => link.getAttribute("href") === "/",
    );
    expect(logoLinks.length).toBeGreaterThan(0);
  });

  it("renders the Open menu button for mobile", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("button", { name: /open menu/i }),
    ).toBeInTheDocument();
  });
});