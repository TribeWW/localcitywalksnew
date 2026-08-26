/**
 * country-flag-icons — unit tests for flag URL map build and catalog merge.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const withConfigMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
    withConfig: (...args: unknown[]) => {
      withConfigMock(...args);
      return {
        fetch: (...fetchArgs: unknown[]) => fetchMock(...fetchArgs),
      };
    },
  },
}));

import {
  buildFlagIconUrlMap,
  getCountryFlagIconUrls,
  mergeFlagIconsOntoCountries,
} from "./country-flag-icons";

describe("buildFlagIconUrlMap", () => {
  it("maps valid ISO2 rows to trimmed URLs and skips incomplete rows", () => {
    const map = buildFlagIconUrlMap([
      { iso2: "es", flagIconUrl: " https://cdn.example/es.svg " },
      { iso2: "FR", flagIconUrl: "https://cdn.example/fr.svg" },
      { iso2: "PT", flagIconUrl: null },
      { iso2: "", flagIconUrl: "https://cdn.example/x.svg" },
      { iso2: "DE", flagIconUrl: "  " },
      null as unknown as { iso2: string; flagIconUrl: string },
    ]);

    expect([...map.entries()]).toEqual([
      ["ES", "https://cdn.example/es.svg"],
      ["FR", "https://cdn.example/fr.svg"],
    ]);
  });

  it("returns an empty map for null/undefined rows", () => {
    expect(buildFlagIconUrlMap(null).size).toBe(0);
    expect(buildFlagIconUrlMap(undefined).size).toBe(0);
  });
});

describe("mergeFlagIconsOntoCountries", () => {
  it("attaches flagIconUrl by ISO2 without mutating unmatched entries", () => {
    const flagIconUrls = new Map([
      ["ES", "https://cdn.example/es.svg"],
      ["PT", "https://cdn.example/pt.svg"],
    ]);

    expect(
      mergeFlagIconsOntoCountries(
        [
          { countryCode: "ES", country: "Spain" },
          { countryCode: "GR", country: "Greece" },
        ],
        flagIconUrls,
      ),
    ).toEqual([
      {
        countryCode: "ES",
        country: "Spain",
        flagIconUrl: "https://cdn.example/es.svg",
      },
      { countryCode: "GR", country: "Greece" },
    ]);
  });
});

describe("getCountryFlagIconUrls", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    withConfigMock.mockReset();
  });

  it("fetches and returns a URL map", async () => {
    fetchMock.mockResolvedValueOnce([
      { iso2: "ES", flagIconUrl: "https://cdn.example/es.svg" },
    ]);

    const map = await getCountryFlagIconUrls();

    expect(withConfigMock).toHaveBeenCalledWith({ useCdn: false });
    expect(map.get("ES")).toBe("https://cdn.example/es.svg");
  });

  it("fails open to an empty map on error", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));

    const map = await getCountryFlagIconUrls();

    expect(map.size).toBe(0);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
