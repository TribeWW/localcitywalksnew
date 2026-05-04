import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ExploreCatalogClient from "./ExploreCatalogClient";

const mockedGetExploreCatalogPage = vi.fn();

vi.mock("@/lib/actions/tour.actions", () => ({
  getExploreCatalogPage: (...args: unknown[]) => mockedGetExploreCatalogPage(...args),
}));

vi.mock("@/components/cards/CityCard", () => ({
  default: ({ cities }: { cities: Array<{ title: string }> }) => (
    <div data-testid="city-card-list">{cities.map((c) => c.title).join(",")}</div>
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

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <div data-testid="sort-select" data-value={value}>
      <button
        type="button"
        onClick={() => onValueChange?.(value === "asc" ? "desc" : "asc")}
      >
        Toggle sort
      </button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => <span />,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe("ExploreCatalogClient country filters", () => {
  it("renders sticky country tablist and removes old modal trigger", async () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    expect(tablist).toBeInTheDocument();

    expect(within(tablist).getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Greece" })).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Portugal" }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Select country" })).not.toBeInTheDocument();
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
      />,
    );

    const allTab = screen.getByRole("tab", { name: "All" });
    expect(allTab).toHaveAttribute("aria-current", "true");

    await userEvent.click(screen.getByRole("tab", { name: "Portugal" }));

    expect(mockedGetExploreCatalogPage).toHaveBeenCalledWith(1, "PT", true);
  });

  it("displays singular 'tour' when totalHits is 1", () => {
    render(
      <ExploreCatalogClient
        initialData={[initialData[0]]}
        totalHits={1}
        initialSortAscending={true}
      />,
    );

    expect(screen.getByText(/found/)).toHaveTextContent("1 tour found");
  });

  it("displays plural 'tours' when totalHits is more than 1", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    expect(screen.getByText(/found/)).toHaveTextContent("2 tours found");
  });

  it("renders only the All tab when initialData has no country codes", () => {
    const dataWithoutCountry = [
      { id: "1", title: "Mystery Walk", image: "/mystery.jpg" },
    ];

    render(
      <ExploreCatalogClient
        initialData={dataWithoutCountry as never}
        totalHits={1}
        initialSortAscending={true}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent("All");
  });

  it("renders countries in alphabetical order in the tablist", () => {
    const multiCountryData = [
      { id: "1", title: "Walk Z", image: "/z.jpg", countryCode: "ES", country: "Spain" },
      { id: "2", title: "Walk A", image: "/a.jpg", countryCode: "GR", country: "Greece" },
      { id: "3", title: "Walk M", image: "/m.jpg", countryCode: "PT", country: "Portugal" },
    ];

    render(
      <ExploreCatalogClient
        initialData={multiCountryData as never}
        totalHits={3}
        initialSortAscending={true}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    const tabs = within(tablist).getAllByRole("tab");
    // First tab is "All", then countries sorted alphabetically
    expect(tabs[0]).toHaveTextContent("All");
    expect(tabs[1]).toHaveTextContent("Greece");
    expect(tabs[2]).toHaveTextContent("Portugal");
    expect(tabs[3]).toHaveTextContent("Spain");
  });

  it("All tab has aria-selected=true initially", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    const allTab = screen.getByRole("tab", { name: "All" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("country tab does NOT have aria-current initially", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    const greeceTab = screen.getByRole("tab", { name: "Greece" });
    expect(greeceTab).not.toHaveAttribute("aria-current");
  });

  it("shows empty state message when filter returns no results", async () => {
    mockedGetExploreCatalogPage.mockResolvedValue({
      success: true,
      data: [],
      totalHits: 0,
    });

    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Greece" }));

    expect(
      await screen.findByText(/no tours found for this country/i),
    ).toBeInTheDocument();
  });

  it("does not render a 'Select country' button (old modal trigger removed)", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /select country/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a sort control in the sticky bar", () => {
    render(
      <ExploreCatalogClient
        initialData={initialData}
        totalHits={2}
        initialSortAscending={true}
      />,
    );

    expect(screen.getByTestId("sort-select")).toBeInTheDocument();
  });

  it("deduplicates countries with the same countryCode", () => {
    const duplicateCountryData = [
      { id: "1", title: "Athens Walk 1", image: "/a1.jpg", countryCode: "GR", country: "Greece" },
      { id: "2", title: "Athens Walk 2", image: "/a2.jpg", countryCode: "GR", country: "Greece" },
      { id: "3", title: "Porto Walk", image: "/p.jpg", countryCode: "PT", country: "Portugal" },
    ];

    render(
      <ExploreCatalogClient
        initialData={duplicateCountryData as never}
        totalHits={3}
        initialSortAscending={true}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Filter by country" });
    const greeceTabs = within(tablist).getAllByRole("tab", { name: "Greece" });
    // Should only appear once
    expect(greeceTabs).toHaveLength(1);
  });
});
