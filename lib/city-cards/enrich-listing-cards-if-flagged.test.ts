import { beforeEach, describe, expect, it, vi } from "vitest";

const enrichActionMock = vi.fn();

vi.mock("@/lib/actions/city-card-listing.actions", () => ({
  enrichCityCardsForListingAction: (...args: unknown[]) =>
    enrichActionMock(...args),
}));

import { enrichListingCardsIfFlagged } from "@/lib/city-cards/enrich-listing-cards-if-flagged";

const baseCard = {
  id: "101",
  title: "Barcelona",
  image: "/preview.jpg",
};

describe("enrichListingCardsIfFlagged", () => {
  beforeEach(() => {
    enrichActionMock.mockReset();
  });

  it("returns cards unchanged when the flag is off", async () => {
    const result = await enrichListingCardsIfFlagged([baseCard], false);

    expect(result).toEqual([baseCard]);
    expect(enrichActionMock).not.toHaveBeenCalled();
  });

  it("delegates to the server action when the flag is on", async () => {
    enrichActionMock.mockResolvedValue([
      { ...baseCard, ratingLabel: "4.7", showRating: true },
    ]);

    const result = await enrichListingCardsIfFlagged([baseCard], true);

    expect(enrichActionMock).toHaveBeenCalledWith([baseCard]);
    expect(result[0]?.ratingLabel).toBe("4.7");
  });
});
