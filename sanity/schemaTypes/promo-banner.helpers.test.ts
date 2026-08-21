/**
 * promo-banner.helpers — unit tests for Promo Banner Sanity schema helpers.
 */

import { describe, expect, it } from "vitest";
import {
  PROMO_BANNER_ENDS_AFTER_STARTS_MESSAGE,
  PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE,
  isPromoBannerContentRequired,
  validatePromoBannerEndsAfterStarts,
  validatePromoBannerRequiredWhenEnabled,
} from "./promo-banner.helpers";

describe("isPromoBannerContentRequired", () => {
  it("is true only when enabled is strictly true", () => {
    expect(isPromoBannerContentRequired(true)).toBe(true);
    expect(isPromoBannerContentRequired(false)).toBe(false);
    expect(isPromoBannerContentRequired(undefined)).toBe(false);
    expect(isPromoBannerContentRequired(null)).toBe(false);
  });
});

describe("validatePromoBannerRequiredWhenEnabled", () => {
  it("passes when the banner is disabled even if the value is empty", () => {
    expect(validatePromoBannerRequiredWhenEnabled(undefined, false)).toBe(true);
    expect(validatePromoBannerRequiredWhenEnabled("", false)).toBe(true);
    expect(validatePromoBannerRequiredWhenEnabled("  ", false)).toBe(true);
  });

  it("requires a non-blank value when the banner is enabled", () => {
    expect(validatePromoBannerRequiredWhenEnabled(undefined, true)).toBe(
      PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE,
    );
    expect(validatePromoBannerRequiredWhenEnabled("", true)).toBe(
      PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE,
    );
    expect(validatePromoBannerRequiredWhenEnabled("  ", true)).toBe(
      PROMO_BANNER_REQUIRED_WHEN_ENABLED_MESSAGE,
    );
  });

  it("accepts a non-blank string or datetime when enabled", () => {
    expect(validatePromoBannerRequiredWhenEnabled("SUMMER20", true)).toBe(true);
    expect(
      validatePromoBannerRequiredWhenEnabled("2026-08-21T10:00:00.000Z", true),
    ).toBe(true);
  });
});

describe("validatePromoBannerEndsAfterStarts", () => {
  it("skips comparison when either datetime is missing", () => {
    expect(
      validatePromoBannerEndsAfterStarts(undefined, "2026-08-21T10:00:00.000Z"),
    ).toBe(true);
    expect(
      validatePromoBannerEndsAfterStarts("2026-08-22T10:00:00.000Z", undefined),
    ).toBe(true);
  });

  it("rejects endsAt that is equal to or before startsAt", () => {
    expect(
      validatePromoBannerEndsAfterStarts(
        "2026-08-21T10:00:00.000Z",
        "2026-08-21T10:00:00.000Z",
      ),
    ).toBe(PROMO_BANNER_ENDS_AFTER_STARTS_MESSAGE);
    expect(
      validatePromoBannerEndsAfterStarts(
        "2026-08-20T10:00:00.000Z",
        "2026-08-21T10:00:00.000Z",
      ),
    ).toBe(PROMO_BANNER_ENDS_AFTER_STARTS_MESSAGE);
  });

  it("accepts endsAt strictly after startsAt", () => {
    expect(
      validatePromoBannerEndsAfterStarts(
        "2026-08-22T10:00:00.000Z",
        "2026-08-21T10:00:00.000Z",
      ),
    ).toBe(true);
  });
});
