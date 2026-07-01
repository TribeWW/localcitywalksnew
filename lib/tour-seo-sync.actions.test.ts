/**
 * tour-seo-sync.actions — unit tests for Tour SEO Sanity auto-provision sync.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BokunProduct } from "@/types/bokun";

const fetchMock = vi.fn();
const createIfNotExistsMock = vi.fn();

vi.mock("@/sanity/lib/write-client", () => ({
  writeClient: {
    fetch: (...args: unknown[]) => fetchMock(...args),
    createIfNotExists: (...args: unknown[]) => createIfNotExistsMock(...args),
  },
}));

import { syncTourSeoFromProducts } from "@/lib/actions/tour-seo-sync.actions";

function product(id: string, title: string): BokunProduct {
  return {
    id,
    title,
    keyPhoto: { derived: [] },
  };
}

describe("syncTourSeoFromProducts", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    createIfNotExistsMock.mockReset();
    createIfNotExistsMock.mockResolvedValue({});
  });

  it("creates published shell docs for products missing in Sanity", async () => {
    fetchMock.mockResolvedValue([]);
    createIfNotExistsMock.mockResolvedValue({});

    const result = await syncTourSeoFromProducts([
      product("1077682", "Hello Toledo"),
    ]);

    expect(result).toEqual({
      created: ["1077682"],
      existing: [],
      errors: [],
    });

    expect(createIfNotExistsMock).toHaveBeenCalledWith({
      _id: "tourSeoMetadata-1077682",
      _type: "tourSeoMetadata",
      tour: {
        bokunProductId: "1077682",
        bokunProductTitle: "Hello Toledo",
      },
    });
  });

  it("skips create when a tour SEO doc already exists for the product id", async () => {
    fetchMock.mockResolvedValue([{ id: "1077682" }]);

    const result = await syncTourSeoFromProducts([
      product("1077682", "Hello Toledo"),
    ]);

    expect(result).toEqual({
      created: [],
      existing: ["1077682"],
      errors: [],
    });
    expect(createIfNotExistsMock).not.toHaveBeenCalled();
  });

  it("collects per-product errors without aborting the batch", async () => {
    fetchMock.mockResolvedValue([]);
    createIfNotExistsMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("write failed"));

    const result = await syncTourSeoFromProducts([
      product("1", "Tour One"),
      product("2", "Tour Two"),
    ]);

    expect(result.created).toEqual(["1"]);
    expect(result.existing).toEqual([]);
    expect(result.errors).toEqual([
      { type: "tourSeo", identifier: "2", error: "write failed" },
    ]);
  });
});
