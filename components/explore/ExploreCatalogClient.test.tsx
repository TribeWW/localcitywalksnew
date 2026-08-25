import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExploreCatalogClient from "./ExploreCatalogClient";

const mockedGetExploreCatalogPage = vi.fn();

beforeEach(() => {
  mockedGetExploreCatalogPage.mockReset();
  mockedEnrichListingCardsIfFlagged.mockReset();
  mockedEnrichListingCardsIfFlagged.mockImplementation(
    async (cards: typeof initialData) => cards,
  );
});

vi.mock("@/lib/explore/tour.actions", () => ({
  getExploreCatalogPage: (...args: unknown[]) =>
    mockedGetExploreCatalogPage(...args),
}));

const mockedEnrichListingCardsIfFlagged = vi.fn();

vi.mock("@/lib/city-cards/enrich-listing-cards-if-flagged", () => ({
  enrichListingCardsIfFlagged: (...args: unknown[]) =>
    mockedEnrichListingCardsIfFlagged(...args),
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
  it("accepts featuredCountries prop and defaults to an empty list", () => {
    const { rerender } = render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const filterBar = screen.getByTestId("explore-filter-bar");
    expect(filterBar).toHaveAttribute("data-featured-count", "0");
    expect(screen.getByRole("button", { name: "Select country" })).toBeInTheDocument();

    rerender(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
        featuredCountries={[
          { countryCode: "ES", country: "Spain" },
          { countryCode: "PT", country: "Portugal" },
        ]}
      />,
    );

    expect(filterBar).toHaveAttribute("data-featured-count", "2");
    expect(screen.getByTestId("city-card-list")).toHaveTextContent(
      "Athens Walk,Porto Walk",
    );
  });

  it("omits the All tab, per-country tabs, and quick-filter group when featured list is empty", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Filter by country" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select country" })).toBeInTheDocument();

    expect(screen.getByTestId("explore-tours-found")).toHaveTextContent(
      /2\s*tours\s*found/,
    );
  });

  it("renders featured quick filters without selected/tab semantics", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={[
          ...completeCountryList,
          { countryCode: "ES", country: "Spain" },
        ]}
        featuredCountries={[
          { countryCode: "ES", country: "Spain" },
          { countryCode: "PT", country: "Portugal" },
        ]}
      />,
    );

    const quickFilters = screen.getByRole("group", {
      name: "Filter by country",
    });
    expect(within(quickFilters).getByRole("button", { name: "Spain" })).toBeInTheDocument();
    expect(
      within(quickFilters).getByRole("button", { name: "Portugal" }),
    ).toBeInTheDocument();
    expect(
      within(quickFilters).queryByRole("button", { name: "Greece" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();

    const spain = within(quickFilters).getByRole("button", { name: "Spain" });
    expect(spain).not.toHaveAttribute("aria-current");
    expect(spain).not.toHaveAttribute("aria-selected");
  });

  it("resets the country filter to a single ISO2 when a quick filter is clicked", async () => {
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
        featuredCountries={[{ countryCode: "PT", country: "Portugal" }]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Portugal" }));

    expect(mockedGetExploreCatalogPage).toHaveBeenCalledWith(1, ["PT"], true);
  });

  it("keeps a single-country reset when the same quick filter is clicked twice", async () => {
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
        featuredCountries={[{ countryCode: "PT", country: "Portugal" }]}
      />,
    );

    const user = userEvent.setup();
    const portugal = screen.getByRole("button", { name: "Portugal" });
    await user.click(portugal);
    await user.click(portugal);

    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(1, 1, ["PT"], true);
    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(2, 1, ["PT"], true);
  });

  it("still lists catalog-only countries in the picker", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={[
          ...completeCountryList,
          { countryCode: "ES", country: "Spain" },
        ]}
        featuredCountries={[{ countryCode: "PT", country: "Portugal" }]}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Select country" }));
    expect(
      screen.getByRole("checkbox", { name: "Country option Spain" }),
    ).toBeInTheDocument();
  });

  it("shows chips for a quick-filter selection and for picker multi-add after reset", async () => {
    mockedGetExploreCatalogPage
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
        featuredCountries={[{ countryCode: "PT", country: "Portugal" }]}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Portugal" }));

    const meta = screen.getByTestId("explore-catalog-meta");
    const chipRow = screen.getByTestId("explore-country-chips");
    const toursFound = screen.getByTestId("explore-tours-found");
    expect(meta).toContainElement(chipRow);
    expect(meta).toContainElement(toursFound);
    expect(toursFound).toHaveTextContent(/1\s*tour\s*found/);
    expect(
      screen.getByRole("button", { name: "Portugal remove" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Greece remove" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select country" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Country option Greece" }),
    );

    expect(meta).toContainElement(
      screen.getByRole("button", { name: "Portugal remove" }),
    );
    expect(meta).toContainElement(
      screen.getByRole("button", { name: "Greece remove" }),
    );
    expect(
      screen.getByRole("button", { name: "Clear all countries" }),
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Select country" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Country option Greece" }),
    );
    await user.click(screen.getByRole("button", { name: "Select country" }));
    await user.click(screen.getByRole("button", { name: "Select country" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Country option Portugal" }),
    );

    const secondCallArgs = mockedGetExploreCatalogPage.mock.calls[1];
    expect(secondCallArgs[0]).toBe(1);
    expect(secondCallArgs[2]).toBe(true);
    expect(secondCallArgs[1]).toHaveLength(2);
    expect(secondCallArgs[1]).toEqual(expect.arrayContaining(["GR", "PT"]));
    expect(
      screen.getByRole("button", { name: "Greece remove" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Portugal remove" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Greece remove" }));
    expect(mockedGetExploreCatalogPage).toHaveBeenNthCalledWith(
      3,
      1,
      ["PT"],
      true,
    );

    await user.click(
      screen.getByRole("button", { name: "Clear all countries" }),
    );
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
    await user.click(screen.getByRole("button", { name: "Select country" }));
    expect(
      screen.getByRole("checkbox", { name: "Country option Greece" }),
    ).toBeInTheDocument();

    await user.click(document.body);
    expect(
      screen.queryByRole("checkbox", { name: "Country option Greece" }),
    ).not.toBeInTheDocument();
  });

  it("closes mobile country dropdown on Escape", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Select country" }));
    expect(
      screen.getByRole("checkbox", { name: "Country option Greece" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("checkbox", { name: "Country option Greece" }),
    ).not.toBeInTheDocument();
  });

  it("enriches filtered catalog results when cards-widget-update is enabled", async () => {
    const filteredCard = {
      id: "3",
      title: "Lisbon Walk",
      image: "/lisbon.jpg",
      countryCode: "PT",
      country: "Portugal",
    };

    mockedGetExploreCatalogPage.mockResolvedValue({
      success: true,
      data: [filteredCard],
      totalHits: 1,
    });
    mockedEnrichListingCardsIfFlagged.mockResolvedValue([
      {
        ...filteredCard,
        ratingLabel: "4.6",
        showRating: true,
      },
    ]);

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
        cardsWidgetUpdate
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Select country" }));
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Country option Portugal" }),
    );

    expect(mockedEnrichListingCardsIfFlagged).toHaveBeenCalledWith(
      [filteredCard],
      true,
    );
  });

  it("does not append a stale load-more page after filter replaces the list", async () => {
    const stalePageCard = {
      id: "99",
      title: "Stale Page Walk",
      image: "/stale.jpg",
      countryCode: "ES",
      country: "Spain",
    };
    let resolvePageTwo: (value: {
      success: boolean;
      data: typeof stalePageCard[];
      totalHits: number;
    }) => void = () => {};

    mockedGetExploreCatalogPage.mockImplementation((page) => {
      if (page === 2) {
        return new Promise((resolve) => {
          resolvePageTwo = resolve;
        });
      }

      return Promise.resolve({
        success: true,
        data: [initialData[1]],
        totalHits: 1,
      });
    });

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={40}
        initialSortAscending={true}
        completeCountryList={completeCountryList}
        featuredCountries={[{ countryCode: "PT", country: "Portugal" }]}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Load more tours" }));
    fireEvent.click(screen.getByRole("button", { name: "Portugal" }));

    resolvePageTwo({
      success: true,
      data: [stalePageCard],
      totalHits: 40,
    });

    await vi.waitFor(() => {
      expect(screen.getByTestId("city-card-list")).toHaveTextContent(
        "Porto Walk",
      );
    });
    expect(screen.getByTestId("city-card-list")).not.toHaveTextContent(
      "Stale Page Walk",
    );
  });
});
