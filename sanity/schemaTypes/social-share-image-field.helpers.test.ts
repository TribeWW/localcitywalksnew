/**
 * social-share-image-field.helpers — unit tests for share image Studio validation.
 */

import { describe, expect, it } from "vitest";
import {
  SOCIAL_SHARE_ALT_WARNING,
  SOCIAL_SHARE_DIMENSIONS_FETCH_WARNING,
  SOCIAL_SHARE_MIN_HEIGHT,
  SOCIAL_SHARE_MIN_WIDTH,
  SOCIAL_SHARE_SIZE_WARNING,
  validateSocialShareImageAlt,
  validateSocialShareImageSize,
  validateSocialShareImageSizeFromFetch,
} from "./social-share-image-field.helpers";

describe("validateSocialShareImageSize", () => {
  it("skips when dimensions are missing", () => {
    expect(validateSocialShareImageSize(null)).toBe(true);
    expect(validateSocialShareImageSize(undefined)).toBe(true);
    expect(validateSocialShareImageSize({})).toBe(true);
    expect(validateSocialShareImageSize({ width: 1200 })).toBe(true);
  });

  it("passes when the image is at least 1200×630", () => {
    expect(
      validateSocialShareImageSize({
        width: SOCIAL_SHARE_MIN_WIDTH,
        height: SOCIAL_SHARE_MIN_HEIGHT,
      }),
    ).toBe(true);
    expect(validateSocialShareImageSize({ width: 1600, height: 900 })).toBe(
      true,
    );
  });

  it("warns when either dimension is below the recommended size", () => {
    expect(
      validateSocialShareImageSize({ width: 1199, height: 630 }),
    ).toBe(SOCIAL_SHARE_SIZE_WARNING);
    expect(
      validateSocialShareImageSize({ width: 1200, height: 629 }),
    ).toBe(SOCIAL_SHARE_SIZE_WARNING);
  });
});

describe("validateSocialShareImageSizeFromFetch", () => {
  it("preserves size validation when dimensions resolve", async () => {
    await expect(
      validateSocialShareImageSizeFromFetch(async () => ({
        width: 1600,
        height: 900,
      })),
    ).resolves.toBe(true);
    await expect(
      validateSocialShareImageSizeFromFetch(async () => ({
        width: 800,
        height: 400,
      })),
    ).resolves.toBe(SOCIAL_SHARE_SIZE_WARNING);
  });

  it("warns when the dimensions fetch rejects", async () => {
    await expect(
      validateSocialShareImageSizeFromFetch(async () => {
        throw new Error("network");
      }),
    ).resolves.toBe(SOCIAL_SHARE_DIMENSIONS_FETCH_WARNING);
  });
});

describe("validateSocialShareImageAlt", () => {
  it("passes when there is no image asset", () => {
    expect(validateSocialShareImageAlt(undefined, false)).toBe(true);
    expect(validateSocialShareImageAlt("", false)).toBe(true);
  });

  it("passes when alt text is non-blank", () => {
    expect(validateSocialShareImageAlt("City walk", true)).toBe(true);
  });

  it("warns when an image is present without alt text", () => {
    expect(validateSocialShareImageAlt(undefined, true)).toBe(
      SOCIAL_SHARE_ALT_WARNING,
    );
    expect(validateSocialShareImageAlt("", true)).toBe(
      SOCIAL_SHARE_ALT_WARNING,
    );
    expect(validateSocialShareImageAlt("   ", true)).toBe(
      SOCIAL_SHARE_ALT_WARNING,
    );
  });
});
