/**
 * ExploreCatalogSkeleton — loading placeholder shape for the explore filter bar.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExploreCatalogSkeleton from "./ExploreCatalogSkeleton";

describe("ExploreCatalogSkeleton", () => {
  it("resembles picker + quick filters sticky bar and count/chips/sort meta row", () => {
    render(<ExploreCatalogSkeleton />);

    const filterBar = screen.getByTestId("explore-catalog-skeleton-filters");
    expect(filterBar).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();

    expect(
      screen.getByTestId("explore-catalog-skeleton-picker"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("explore-catalog-skeleton-quick-filters"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("explore-catalog-skeleton-sort-mobile"),
    ).not.toBeInTheDocument();

    const meta = screen.getByTestId("explore-catalog-skeleton-meta");
    expect(meta).toContainElement(
      screen.getByTestId("explore-catalog-skeleton-count"),
    );
    expect(meta).toContainElement(
      screen.getByTestId("explore-catalog-skeleton-chips"),
    );
    expect(meta).toContainElement(
      screen.getByTestId("explore-catalog-skeleton-sort"),
    );
    expect(
      screen.getByTestId("explore-catalog-skeleton-grid"),
    ).toBeInTheDocument();
  });
});
