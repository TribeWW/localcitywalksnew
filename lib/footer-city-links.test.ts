import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

import { client } from "@/sanity/lib/client";
import { getFooterCityLinkItems } from "./footer-city-links";

const mockedFetch = vi.mocked(client.fetch);

describe("getFooterCityLinkItems", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("fetches with a city + tourPagePath GROQ and returns normalized rows", async () => {
    mockedFetch.mockImplementation(
      async () =>
        [
          { name: "Paris", href: "/tours/paris" },
          { name: "Berlin", href: "/tours/berlin" },
        ] as never,
    );

    const items = await getFooterCityLinkItems();

    expect(items).toEqual([
      { name: "Berlin", href: "/tours/berlin" },
      { name: "Paris", href: "/tours/paris" },
    ]);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const query = String(mockedFetch.mock.calls[0]?.[0] ?? "");
    expect(query).toContain('_type == "city"');
    expect(query).toContain("tourPagePath");
    expect(query).toContain("drafts");
    expect(query).not.toMatch(/\|\s*order\s*\(/);
  });

  it("sorts accent-insensitive and strips accents in labels (e.g. Ávila)", async () => {
    mockedFetch.mockImplementation(
      async () =>
        [
          { name: "Berlin", href: "/tours/berlin" },
          { name: "Ávila", href: "/tours/avila" },
        ] as never,
    );

    const items = await getFooterCityLinkItems();
    expect(items).toEqual([
      { name: "Avila", href: "/tours/avila" },
      { name: "Berlin", href: "/tours/berlin" },
    ]);
  });

  it("applies normalize rules to fetch result", async () => {
    mockedFetch.mockImplementation(
      async () =>
        [
          { name: "  Paris  ", href: "  /tours/paris  " },
          { name: "Bad", href: "/other" },
        ] as never,
    );

    const items = await getFooterCityLinkItems();
    expect(items).toEqual([{ name: "Paris", href: "/tours/paris" }]);
  });

  it("returns [] when fetch throws", async () => {
    mockedFetch.mockRejectedValue(new Error("Sanity unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getFooterCityLinkItems()).resolves.toEqual([]);

    spy.mockRestore();
  });
});
