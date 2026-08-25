/**
 * backfill-catalog-countries — unit tests for preview country fill from detail.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CityCardData } from "@/types/bokun";

const getTourDetailByIdMock = vi.fn();

vi.mock("@/lib/tours/detail.actions", () => ({
  getTourDetailById: (...args: unknown[]) => getTourDetailByIdMock(...args),
}));

import {
  backfillMissingCatalogCountries,
  cardNeedsCountryBackfill,
  countryFromGooglePlace,
  mergeBackfilledCountry,
} from "./backfill-catalog-countries";

const baseCard = (overrides: Partial<CityCardData> = {}): CityCardData => ({
  id: "15683",
  title: "Test Walk",
  image: "/test.jpg",
  countryCode: "",
  country: "Unknown",
  ...overrides,
});

describe("cardNeedsCountryBackfill", () => {
  it("is true when countryCode is missing, blank, or whitespace", () => {
    expect(cardNeedsCountryBackfill(baseCard({ countryCode: "" }))).toBe(true);
    expect(cardNeedsCountryBackfill(baseCard({ countryCode: "  " }))).toBe(
      true,
    );
    expect(
      cardNeedsCountryBackfill(baseCard({ countryCode: undefined })),
    ).toBe(true);
  });

  it("is false when an ISO2 code is already present", () => {
    expect(
      cardNeedsCountryBackfill(baseCard({ countryCode: "PT" })),
    ).toBe(false);
  });
});

describe("countryFromGooglePlace", () => {
  it("normalizes ISO2 and keeps the display name", () => {
    expect(
      countryFromGooglePlace({ countryCode: "pt", country: "Portugal" }),
    ).toEqual({ countryCode: "PT", country: "Portugal" });
  });

  it("rejects missing or invalid country codes", () => {
    expect(countryFromGooglePlace(undefined)).toBeNull();
    expect(
      countryFromGooglePlace({ countryCode: "PRT", country: "Portugal" }),
    ).toBeNull();
    expect(
      countryFromGooglePlace({ countryCode: "", country: "Portugal" }),
    ).toBeNull();
  });
});

describe("mergeBackfilledCountry", () => {
  it("fills blank ISO2 and Unknown labels from detail", () => {
    expect(
      mergeBackfilledCountry(baseCard(), {
        countryCode: "ES",
        country: "Spain",
      }),
    ).toEqual(
      expect.objectContaining({
        countryCode: "ES",
        country: "Spain",
      }),
    );
  });

  it("does not overwrite an existing countryCode", () => {
    const card = baseCard({ countryCode: "GR", country: "Greece" });
    expect(
      mergeBackfilledCountry(card, {
        countryCode: "ES",
        country: "Spain",
      }),
    ).toBe(card);
  });

  it("keeps a real country label when only the code was missing", () => {
    expect(
      mergeBackfilledCountry(
        baseCard({ country: "Portugal" }),
        { countryCode: "PT", country: "República Portuguesa" },
      ),
    ).toEqual(
      expect.objectContaining({
        countryCode: "PT",
        country: "Portugal",
      }),
    );
  });
});

describe("backfillMissingCatalogCountries", () => {
  beforeEach(() => {
    getTourDetailByIdMock.mockReset();
  });

  it("returns an empty array for empty input without fetching", async () => {
    await expect(backfillMissingCatalogCountries([])).resolves.toEqual([]);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
  });

  it("does not fetch when every card already has a country code", async () => {
    const cards = [
      baseCard({ id: "1", countryCode: "PT", country: "Portugal" }),
    ];

    const result = await backfillMissingCatalogCountries(cards);

    expect(result).toEqual(cards);
    expect(result).not.toBe(cards);
    expect(getTourDetailByIdMock).not.toHaveBeenCalled();
  });

  it("fills missing countries from activity detail and skips failures", async () => {
    getTourDetailByIdMock.mockImplementation(async (id: string) => {
      if (id === "15683") {
        return {
          success: true,
          data: {
            id: "15683",
            title: "Test Walk",
            googlePlace: { countryCode: "pt", country: "Portugal" },
          },
        };
      }
      return { success: false, error: "Tour not found" };
    });

    const input = [
      baseCard({ id: "15683" }),
      baseCard({ id: "15684", title: "Other Walk" }),
      baseCard({
        id: "15685",
        title: "Athens Walk",
        countryCode: "GR",
        country: "Greece",
      }),
    ];

    const result = await backfillMissingCatalogCountries(input);

    expect(getTourDetailByIdMock).toHaveBeenCalledTimes(2);
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("15683");
    expect(getTourDetailByIdMock).toHaveBeenCalledWith("15684");
    expect(result[0]).toMatchObject({
      id: "15683",
      countryCode: "PT",
      country: "Portugal",
    });
    expect(result[1]).toMatchObject({
      id: "15684",
      countryCode: "",
      country: "Unknown",
    });
    expect(result[2]).toMatchObject({
      id: "15685",
      countryCode: "GR",
      country: "Greece",
    });
    expect(input[0]?.countryCode).toBe("");
  });
});
