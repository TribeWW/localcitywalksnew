import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/footer-city-links", () => ({
  getFooterCityLinkItems: vi.fn(),
}));

import { getFooterCityLinkItems } from "@/lib/footer-city-links";
import FooterCityLinks from "./FooterCityLinks";

const mockedGetFooterCityLinkItems = vi.mocked(getFooterCityLinkItems);

describe("FooterCityLinks (async server entry)", () => {
  beforeEach(() => {
    mockedGetFooterCityLinkItems.mockReset();
  });

  it("returns null when there are no items", async () => {
    mockedGetFooterCityLinkItems.mockResolvedValue([]);
    const tree = await FooterCityLinks();
    const { container } = render(tree);
    expect(container.firstChild).toBeNull();
  });

  it("renders the link strip from getFooterCityLinkItems data", async () => {
    mockedGetFooterCityLinkItems.mockResolvedValue([
      { name: "Paris", href: "/tours/paris" },
      { name: "Berlin", href: "/tours/berlin" },
    ]);
    const tree = await FooterCityLinks();
    render(tree);

    expect(screen.getByRole("link", { name: "Paris" })).toHaveAttribute(
      "href",
      "/tours/paris",
    );
    expect(screen.getByRole("link", { name: "Berlin" })).toHaveAttribute(
      "href",
      "/tours/berlin",
    );
    expect(screen.getAllByText("·")).toHaveLength(1);
    expect(mockedGetFooterCityLinkItems).toHaveBeenCalledTimes(1);
  });
});
