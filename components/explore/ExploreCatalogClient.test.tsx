import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExploreCatalogClient from "./ExploreCatalogClient";

const mockedGetExploreCatalogPage = vi.fn();

beforeEach(() => {
  mockedGetExploreCatalogPage.mockReset();
});

vi.mock("@/lib/actions/tour.actions", () => ({
  getExploreCatalogPage: (...args: unknown[]) =>
    mockedGetExploreCatalogPage(...args),
}));

vi.mock("@/components/cards/CityCard", () => ({
  default: ({ cities }: { cities: Array<{ title: string }> }) => (
    <div data-testid="city-card-list">
      {cities.map((c) => c.title).join(",")}
    </div>
  ),
}));

const initialData = [
  {
    id: "1",
    title: "Athens Walk",
    image: "/athens.jpg",
    countryCode: "GR",
    country: "Greece",
  },
  {
    id: "2",
    title: "Porto Walk",
    image: "/porto.jpg",
    countryCode: "PT",
    country: "Portugal",
  },
];

const completeCountryList = [
  { countryCode: "GR", country: "Greece" },
  { countryCode: "PT", country: "Portugal" },
];

describe("ExploreCatalogClient country filters", () => {
  it("renders countries from completeCountryList even when not present in current page data", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={[
          ...completeCountryList,
          { countryCode: "ES", country: "Spain" },
        ]}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    expect(
      within(tablist).getByRole("tab", { name: "Spain" }),
    ).toBeInTheDocument();
  });

  it("renders sticky country tablist and removes old modal trigger", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    expect(tablist).toBeInTheDocument();

    expect(
      within(tablist).getByRole("tab", { name: "All" }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Greece" }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Portugal" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Select country" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Filter by country")).not.toBeInTheDocument();

    const gridArea = screen.getByTestId("city-card-list").parentElement;
    expect(gridArea).toHaveTextContent(/2\s*tours\s*found/);
  });

  it("keeps active tab semantics and calls filter on click", async () => {
    mockedGetExploreCatalogPage.mockResolvedValue({
      success: true,
      data: [initialData[1]],
      totalHits: 1,
    });

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const allTab = screen.getByRole("tab", { name: "All" });
    expect(allTab).toHaveAttribute("aria-current", "true");

    await userEvent.click(screen.getByRole("tab", { name: "Portugal" }));

    expect(mockedGetExploreCatalogPage).toHaveBeenCalledWith(1, ["PT"], true);
  });

  it("resets to all countries after selecting a country", async () => {
    mockedGetExploreCatalogPage
      .mockResolvedValueOnce({
        success: true,
        data: [initialData[0]],
        totalHits: 1,
      })
      .mockResolvedValueOnce({
        success: true,
        data: initialData,
        totalHits: 2,
      });

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Greece" }));
    await user.click(screen.getByRole("tab", { name: "All" }));

    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(
      1,
      1,
      ["GR"],
      true,
    );
    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(
      2,
      1,
      [],
      true,
    );
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("supports mobile multi-select chips with remove and clear all", async () => {
    mockedGetExploreCatalogPage
      .mockResolvedValueOnce({
        success: true,
        data: [initialData[0]],
        totalHits: 1,
      })
      .mockResolvedValueOnce({
        success: true,
        data: initialData,
        totalHits: 2,
      })
      .mockResolvedValueOnce({
        success: true,
        data: [initialData[1]],
        totalHits: 1,
      })
      .mockResolvedValueOnce({
        success: true,
        data: initialData,
        totalHits: 2,
      });

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Country" }));
    await user.click(screen.getByRole("button", { name: "Country option Greece" }));
    await user.click(screen.getByRole("button", { name: "Country" }));
    await user.click(screen.getByRole("button", { name: "Country" }));
    await user.click(
      screen.getByRole("button", { name: "Country option Portugal" }),
    );

    expect(
      mockedGetExploreCatalogPage,
    ).toHaveBeenNthCalledWith(2, 1, ["GR", "PT"], true);
    expect(screen.getByRole("button", { name: "Greece remove" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Portugal remove" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Greece remove" }));
    expect(
      mockedGetExploreCatalogPage,
    ).toHaveBeenNthCalledWith(3, 1, ["PT"], true);

    await user.click(screen.getByRole("button", { name: "Clear all countries" }));
    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(4, 1, [], true);
  });

  it("closes mobile country dropdown when clicking outside", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Country" }));
    expect(
      screen.getByRole("button", { name: "Country option Greece" }),
    ).toBeInTheDocument();

    await user.click(document.body);
    expect(
      screen.queryByRole("button", { name: "Country option Greece" }),
    ).not.toBeInTheDocument();
  });
});
