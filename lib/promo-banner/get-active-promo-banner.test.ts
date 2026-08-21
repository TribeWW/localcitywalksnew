/**
 * get-active-promo-banner — unit tests for the marketing-layout promo loader.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const promoCodeFlagMock = vi.fn();

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

vi.mock("@/flags", () => ({
  promoCode: (...args: unknown[]) => promoCodeFlagMock(...args),
}));

import { getActivePromoBanner } from "./get-active-promo-banner";

const LIVE_DOC = {
  enabled: true,
  headline: "Save 20% this week",
  promoCode: "SUMMER20",
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-08-31T00:00:00.000Z",
};

describe("getActivePromoBanner", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    promoCodeFlagMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns null without fetching when the promo-code flag is off", async () => {
    promoCodeFlagMock.mockResolvedValue(false);

    await expect(getActivePromoBanner()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null and logs when the Sanity fetch throws", async () => {
    promoCodeFlagMock.mockResolvedValue(true);
    fetchMock.mockRejectedValue(new Error("Sanity down"));

    await expect(getActivePromoBanner()).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("fetches with revalidate 60 and returns the resolved active offer", async () => {
    promoCodeFlagMock.mockResolvedValue(true);
    fetchMock.mockResolvedValue(LIVE_DOC);

    const result = await getActivePromoBanner(
      new Date("2026-08-15T12:00:00.000Z"),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      {},
      { next: { revalidate: 60 } },
    );
    expect(result).toEqual({
      headline: "Save 20% this week",
      promoCode: "SUMMER20",
      startsAt: LIVE_DOC.startsAt,
      endsAt: LIVE_DOC.endsAt,
      campaignId:
        "2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20",
    });
  });
});
