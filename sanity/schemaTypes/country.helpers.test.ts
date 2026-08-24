/**
 * country.helpers — unit tests for Featured-on-explore Sanity schema helpers.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValidationContext } from "sanity";
import {
  FEATURED_EXPLORE_MAX,
  FEATURED_ON_EXPLORE_CAP_MESSAGE,
  formatFeaturedExploreSlotsLabel,
  validateFeaturedOnExploreCap,
} from "./country.helpers";

describe("FEATURED_EXPLORE_MAX", () => {
  it("caps featured countries at five", () => {
    expect(FEATURED_EXPLORE_MAX).toBe(5);
  });
});

describe("formatFeaturedExploreSlotsLabel", () => {
  it("shows used count, max, and remaining slots", () => {
    expect(formatFeaturedExploreSlotsLabel(3, 5)).toBe(
      "Featured slots: 3 of 5 used (2 remaining)",
    );
  });

  it("shows zero remaining when at capacity", () => {
    expect(formatFeaturedExploreSlotsLabel(5, 5)).toBe(
      "Featured slots: 5 of 5 used (0 remaining)",
    );
  });

  it("clamps remaining at zero when used exceeds max", () => {
    expect(formatFeaturedExploreSlotsLabel(7, 5)).toBe(
      "Featured slots: 7 of 5 used (0 remaining)",
    );
  });
});

describe("validateFeaturedOnExploreCap", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
  });

  function buildContext(
    document: Record<string, unknown> | undefined,
  ): ValidationContext {
    return {
      document,
      getClient: () => ({ fetch: fetchMock }),
    } as unknown as ValidationContext;
  }

  it("skips the GROQ check when the flag is false", async () => {
    await expect(
      validateFeaturedOnExploreCap(
        false,
        buildContext({ _id: "country-es" }),
      ),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips the GROQ check when the flag is unset", async () => {
    await expect(
      validateFeaturedOnExploreCap(
        undefined,
        buildContext({ _id: "country-es" }),
      ),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes when fewer than five other published countries are featured", async () => {
    fetchMock.mockResolvedValueOnce(4);

    await expect(
      validateFeaturedOnExploreCap(
        true,
        buildContext({ _id: "drafts.country-es" }),
      ),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ publishedId: "country-es" }),
    );
  });

  it("fails when five other published countries are already featured", async () => {
    fetchMock.mockResolvedValueOnce(5);

    await expect(
      validateFeaturedOnExploreCap(
        true,
        buildContext({ _id: "country-at" }),
      ),
    ).resolves.toBe(FEATURED_ON_EXPLORE_CAP_MESSAGE);
  });

  it("strips the drafts. prefix before excluding the current document", async () => {
    fetchMock.mockResolvedValueOnce(0);

    await validateFeaturedOnExploreCap(
      true,
      buildContext({ _id: "drafts.country-fr" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      { publishedId: "country-fr" },
    );
  });

  it("skips the GROQ check when the document has no _id", async () => {
    await expect(
      validateFeaturedOnExploreCap(true, buildContext(undefined)),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
