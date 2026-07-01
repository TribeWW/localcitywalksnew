/**
 * fetch-all-search-products — unit tests for full-catalog Bokun search helper.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bokun", () => ({
  createBokunUrl: vi.fn(() => "https://bokun.test/activity.json/search"),
  generateBokunHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
}));

import { fetchAllBokunSearchProducts } from "@/lib/bokun/fetch-all-search-products";

function product(id: string) {
  return {
    id,
    title: `Tour ${id}`,
    keyPhoto: { derived: [] },
  };
}

describe("fetchAllBokunSearchProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pages until totalHits is reached and returns all products", async () => {
    const pageOne = Array.from({ length: 20 }, (_, i) => product(String(i + 1)));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: pageOne,
          totalHits: 21,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [product("21")],
          totalHits: 21,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAllBokunSearchProducts()).resolves.toEqual({
      ok: true,
      products: [...pageOne, product("21")],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
