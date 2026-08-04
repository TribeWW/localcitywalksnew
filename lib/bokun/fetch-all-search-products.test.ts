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
    const pageOne = Array.from({ length: 100 }, (_, i) =>
      product(String(i + 1)),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: pageOne,
          totalHits: 101,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [product("101")],
          totalHits: 101,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAllBokunSearchProducts()).resolves.toEqual({
      ok: true,
      products: [...pageOne, product("101")],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(firstBody.pageSize).toBe(100);
  });
});
