/**
 * tour-seo-metadata.helpers — unit tests for Tour SEO Sanity schema helpers.
 */

import { describe, expect, it, vi } from "vitest";
import type { ValidationContext } from "sanity";
import {
  TOUR_SEO_DUPLICATE_COUNT_QUERY,
  isDigitsOnlyBokunProductId,
  prepareTourSeoMetadataPreview,
  resolveSanityDraftPublishedIds,
  validateUniqueTourSeoDocument,
} from "./tour-seo-metadata.helpers";

describe("isDigitsOnlyBokunProductId", () => {
  it("accepts non-empty digit-only strings", () => {
    expect(isDigitsOnlyBokunProductId("1077682")).toBe(true);
  });

  it("rejects empty strings and non-digit characters", () => {
    expect(isDigitsOnlyBokunProductId("")).toBe(false);
    expect(isDigitsOnlyBokunProductId("tour-42")).toBe(false);
    expect(isDigitsOnlyBokunProductId("42a")).toBe(false);
  });
});

describe("resolveSanityDraftPublishedIds", () => {
  it("maps a draft document id to published and draft pair", () => {
    expect(resolveSanityDraftPublishedIds("drafts.tourSeoMetadata-abc")).toEqual(
      {
        publishedId: "tourSeoMetadata-abc",
        draftId: "drafts.tourSeoMetadata-abc",
      },
    );
  });

  it("maps a published document id to matching draft id", () => {
    expect(resolveSanityDraftPublishedIds("tourSeoMetadata-abc")).toEqual({
      publishedId: "tourSeoMetadata-abc",
      draftId: "drafts.tourSeoMetadata-abc",
    });
  });
});

describe("prepareTourSeoMetadataPreview", () => {
  it("prefers seoTitle for the list title", () => {
    expect(
      prepareTourSeoMetadataPreview({
        seoTitle: "Custom SEO title",
        bokunProductTitle: "Hello Toledo",
        bokunProductId: "1077682",
      }),
    ).toEqual({
      title: "Custom SEO title",
      subtitle: "Hello Toledo · ID: 1077682",
    });
  });

  it("falls back to bokunProductTitle when seoTitle is missing", () => {
    expect(
      prepareTourSeoMetadataPreview({
        bokunProductTitle: "Hello Toledo",
        bokunProductId: "1077682",
      }),
    ).toEqual({
      title: "Hello Toledo",
      subtitle: "Hello Toledo · ID: 1077682",
    });
  });

  it("uses the default title when no seo or tour title is set", () => {
    expect(prepareTourSeoMetadataPreview({})).toEqual({
      title: "Tour SEO Meta Data",
      subtitle: undefined,
    });
  });

  it("shows only the product id when tour title is missing", () => {
    expect(
      prepareTourSeoMetadataPreview({ bokunProductId: "1077682" }),
    ).toEqual({
      title: "Tour SEO Meta Data",
      subtitle: "ID: 1077682",
    });
  });
});

describe("validateUniqueTourSeoDocument", () => {
  const fetchMock = vi.fn();

  function buildContext(
    document: Record<string, unknown> | undefined,
  ): ValidationContext {
    return {
      document,
      getClient: () => ({ fetch: fetchMock }),
    } as unknown as ValidationContext;
  }

  it("skips the GROQ check when the document has no _id", async () => {
    await expect(
      validateUniqueTourSeoDocument(undefined, buildContext(undefined)),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips the GROQ check when tour.bokunProductId is missing", async () => {
    await expect(
      validateUniqueTourSeoDocument(
        undefined,
        buildContext({ _id: "tourSeoMetadata-abc" }),
      ),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes when no other SEO document shares the tour id", async () => {
    fetchMock.mockResolvedValueOnce(0);

    await expect(
      validateUniqueTourSeoDocument(
        undefined,
        buildContext({
          _id: "drafts.tourSeoMetadata-abc",
          tour: { bokunProductId: "1077682" },
        }),
      ),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(TOUR_SEO_DUPLICATE_COUNT_QUERY, {
      tourId: "1077682",
      publishedId: "tourSeoMetadata-abc",
      draftId: "drafts.tourSeoMetadata-abc",
    });
  });

  it("returns an error when another SEO document already uses the tour id", async () => {
    fetchMock.mockResolvedValueOnce(1);

    await expect(
      validateUniqueTourSeoDocument(
        undefined,
        buildContext({
          _id: "tourSeoMetadata-abc",
          tour: { bokunProductId: "1077682" },
        }),
      ),
    ).resolves.toBe("An SEO document already exists for this tour");
  });
});
