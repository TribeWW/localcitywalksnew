/**
 * resolve-active-promo-banner — unit tests for pure promo schedule resolution.
 */

import { describe, expect, it } from "vitest";
import {
  buildPromoBannerCampaignId,
  resolveActivePromoBanner,
  type PromoBannerDoc,
} from "./resolve-active-promo-banner";

const BASE_DOC: PromoBannerDoc = {
  enabled: true,
  headline: "Save 20% this week",
  promoCode: "SUMMER20",
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-08-31T00:00:00.000Z",
};

const MID_WINDOW = new Date("2026-08-15T12:00:00.000Z");

describe("buildPromoBannerCampaignId", () => {
  it("joins startsAt, endsAt, and promoCode with |", () => {
    expect(
      buildPromoBannerCampaignId({
        startsAt: BASE_DOC.startsAt!,
        endsAt: BASE_DOC.endsAt!,
        promoCode: BASE_DOC.promoCode!,
      }),
    ).toBe("2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20");
  });
});

describe("resolveActivePromoBanner", () => {
  it("returns null when the document is missing", () => {
    expect(resolveActivePromoBanner(null, MID_WINDOW)).toBeNull();
    expect(resolveActivePromoBanner(undefined, MID_WINDOW)).toBeNull();
  });

  it("returns null when enabled is not true", () => {
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, enabled: false }, MID_WINDOW),
    ).toBeNull();
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, enabled: undefined }, MID_WINDOW),
    ).toBeNull();
  });

  it("returns null when required fields are missing or blank", () => {
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, headline: "  " }, MID_WINDOW),
    ).toBeNull();
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, promoCode: "" }, MID_WINDOW),
    ).toBeNull();
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, startsAt: null }, MID_WINDOW),
    ).toBeNull();
    expect(
      resolveActivePromoBanner({ ...BASE_DOC, endsAt: undefined }, MID_WINDOW),
    ).toBeNull();
  });

  it("returns null before the start (inclusive window)", () => {
    expect(
      resolveActivePromoBanner(
        BASE_DOC,
        new Date("2026-07-31T23:59:59.999Z"),
      ),
    ).toBeNull();
  });

  it("returns the offer at startsAt (inclusive)", () => {
    const result = resolveActivePromoBanner(
      BASE_DOC,
      new Date("2026-08-01T00:00:00.000Z"),
    );
    expect(result).toEqual({
      headline: "Save 20% this week",
      promoCode: "SUMMER20",
      startsAt: BASE_DOC.startsAt,
      endsAt: BASE_DOC.endsAt,
      campaignId:
        "2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20",
    });
  });

  it("returns null at endsAt (end-exclusive)", () => {
    expect(
      resolveActivePromoBanner(
        BASE_DOC,
        new Date("2026-08-31T00:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("returns null after endsAt", () => {
    expect(
      resolveActivePromoBanner(
        BASE_DOC,
        new Date("2026-09-01T00:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("trims headline and promoCode on a successful resolve", () => {
    const result = resolveActivePromoBanner(
      {
        ...BASE_DOC,
        headline: "  Save 20%  ",
        promoCode: "  SUMMER20  ",
      },
      MID_WINDOW,
    );
    expect(result).toMatchObject({
      headline: "Save 20%",
      promoCode: "SUMMER20",
      campaignId:
        "2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20",
    });
  });

  it("returns null when datetime fields are not parseable", () => {
    expect(
      resolveActivePromoBanner(
        { ...BASE_DOC, startsAt: "not-a-date" },
        MID_WINDOW,
      ),
    ).toBeNull();
    expect(
      resolveActivePromoBanner(
        { ...BASE_DOC, endsAt: "also-bad" },
        MID_WINDOW,
      ),
    ).toBeNull();
  });
});
