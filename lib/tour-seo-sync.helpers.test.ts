/**
 * tour-seo-sync.helpers — unit tests for Tour SEO Sanity auto-provision helpers.
 */

import { describe, expect, it } from "vitest";
import type { BokunProduct } from "@/types/bokun";
import {
  extractTourSeoSyncCandidates,
  partitionTourSeoCandidates,
  tourSeoMetadataDocumentId,
} from "@/lib/tour-seo-sync.helpers";

function product(
  id: string | number,
  title: string,
): BokunProduct {
  return {
    id: String(id),
    title,
    keyPhoto: { derived: [] },
  };
}

describe("tourSeoMetadataDocumentId", () => {
  it("returns a deterministic published document id for a product id", () => {
    expect(tourSeoMetadataDocumentId("1077682")).toBe(
      "tourSeoMetadata-1077682",
    );
  });
});

describe("extractTourSeoSyncCandidates", () => {
  it("dedupes products by normalized digits-only id", () => {
    expect(
      extractTourSeoSyncCandidates([
        product("1077682", "Hello Toledo"),
        product(1077682, "Duplicate"),
        product("999", "Other tour"),
      ]),
    ).toEqual([
      { productId: "1077682", title: "Hello Toledo" },
      { productId: "999", title: "Other tour" },
    ]);
  });

  it("skips products with invalid ids", () => {
    expect(
      extractTourSeoSyncCandidates([product("abc", "No id tour")]),
    ).toEqual([]);
  });

  it("falls back to product id when title is blank", () => {
    expect(extractTourSeoSyncCandidates([product("42", "   ")])).toEqual([
      { productId: "42", title: "42" },
    ]);
  });
});

describe("partitionTourSeoCandidates", () => {
  it("splits candidates into create vs existing buckets", () => {
    const candidates = [
      { productId: "1", title: "Tour A" },
      { productId: "2", title: "Tour B" },
    ];

    expect(
      partitionTourSeoCandidates(candidates, new Set(["1"])),
    ).toEqual({
      toCreate: [{ productId: "2", title: "Tour B" }],
      existing: ["1"],
    });
  });
});
