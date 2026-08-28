/**
 * Calendar — layout regression specs for navLayout grid placement.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/ui/calendar";

function getMonths(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".rdp-month"));
}

function getMonthGrids(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="grid"]'));
}

describe("Calendar — navLayout grid placement", () => {
  it("around: keeps month grid on row 2 without reserving a nav row", () => {
    const { container } = render(
      <Calendar mode="single" navLayout="around" defaultMonth={new Date(2026, 5, 1)} />,
    );

    const [month] = getMonths(container);
    const [grid] = getMonthGrids(container);

    expect(month?.className).not.toContain("has-[>nav]:grid-rows");
    expect(container.querySelector("nav")).not.toBeInTheDocument();
    expect(grid?.className).toContain("row-start-2");
    expect(grid?.className).not.toContain("row-start-3");
  });

  it("after (single month): reserves row 2 for in-flow nav and places grid on row 3", () => {
    const { container } = render(
      <Calendar
        mode="single"
        navLayout="after"
        numberOfMonths={1}
        defaultMonth={new Date(2026, 5, 1)}
      />,
    );

    const [month] = getMonths(container);
    const nav = container.querySelector("nav");
    const [grid] = getMonthGrids(container);

    expect(month?.className).toContain("has-[>nav]:grid-rows");
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain("row-start-2");
    expect(nav?.className).not.toContain("absolute");
    expect(grid?.className).toContain("row-start-2");
    expect(grid?.className).toContain("[.rdp-month:has(>nav)_&]:row-start-3");
  });

  it("after (multi month): only the last month reserves a nav row", () => {
    const { container } = render(
      <Calendar
        mode="single"
        navLayout="after"
        numberOfMonths={2}
        defaultMonth={new Date(2026, 5, 1)}
      />,
    );

    const months = getMonths(container);
    const grids = getMonthGrids(container);
    const nav = container.querySelector("nav");

    expect(months).toHaveLength(2);
    expect(nav).toBeInTheDocument();
    expect(months[0]?.querySelector("nav")).toBeNull();
    expect(nav?.parentElement).toBe(months[1]);

    const firstMonthChildren = Array.from(months[0]?.children ?? []);
    expect(firstMonthChildren.some((child) => child.getAttribute("role") === "grid")).toBe(
      true,
    );
    expect(firstMonthChildren.some((child) => child.tagName === "NAV")).toBe(false);

    const lastMonthChildren = Array.from(months[1]?.children ?? []);
    const navIndex = lastMonthChildren.findIndex((child) => child.tagName === "NAV");
    const gridIndex = lastMonthChildren.findIndex(
      (child) => child.getAttribute("role") === "grid",
    );
    expect(navIndex).toBeGreaterThan(-1);
    expect(gridIndex).toBeGreaterThan(navIndex);

    expect(grids[0]?.className).toContain("row-start-2");
    expect(grids[1]?.className).toContain("row-start-2");
    expect(grids[1]?.className).toContain("[.rdp-month:has(>nav)_&]:row-start-3");
  });
});
