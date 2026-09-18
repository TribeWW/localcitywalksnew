/**
 * Checkout id generator + schema — WKS + 9 alphanumeric (LOC short external ref).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHECKOUT_ID_PREFIX,
  CHECKOUT_ID_SUFFIX_LENGTH,
  CHECKOUT_ID_WKS_CUTOVER_AT_MS,
  LEGACY_CHECKOUT_ID_SUNSET_AT_MS,
  checkoutIdSchema,
  generateCheckoutId,
  isLegacyCheckoutIdAccepted,
  resolvableCheckoutIdSchema,
} from "@/lib/checkout/checkout-id";

const LEGACY_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("generateCheckoutId", () => {
  it("returns WKS prefix, length 12, and uppercase alphanumeric suffix", () => {
    const id = generateCheckoutId();

    expect(id.startsWith(CHECKOUT_ID_PREFIX)).toBe(true);
    expect(id).toHaveLength(CHECKOUT_ID_PREFIX.length + CHECKOUT_ID_SUFFIX_LENGTH);
    expect(id).toMatch(/^WKS[A-Z0-9]{9}$/);
  });

  it("produces distinct values across calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateCheckoutId()));
    expect(ids.size).toBe(20);
  });
});

describe("checkoutIdSchema", () => {
  it("accepts a valid WKS id", () => {
    expect(checkoutIdSchema.safeParse("WKSAB12CD34E").success).toBe(true);
  });

  it("rejects uuid, wrong prefix, lowercase, and wrong length", () => {
    expect(checkoutIdSchema.safeParse(LEGACY_UUID).success).toBe(false);
    expect(checkoutIdSchema.safeParse("LCWAB12CD34E").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSab12cd34e").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSAB12CD34").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSAB12CD34EX").success).toBe(false);
  });
});

describe("resolvableCheckoutIdSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts WKS ids before and after the legacy sunset", () => {
    vi.setSystemTime(CHECKOUT_ID_WKS_CUTOVER_AT_MS);
    expect(resolvableCheckoutIdSchema.safeParse("WKSAB12CD34E").success).toBe(
      true,
    );

    vi.setSystemTime(LEGACY_CHECKOUT_ID_SUNSET_AT_MS);
    expect(resolvableCheckoutIdSchema.safeParse("WKSAB12CD34E").success).toBe(
      true,
    );
  });

  it("accepts legacy UUID checkout ids only before the handoff-TTL sunset", () => {
    vi.setSystemTime(CHECKOUT_ID_WKS_CUTOVER_AT_MS);
    expect(isLegacyCheckoutIdAccepted()).toBe(true);
    expect(resolvableCheckoutIdSchema.safeParse(LEGACY_UUID).success).toBe(true);

    vi.setSystemTime(LEGACY_CHECKOUT_ID_SUNSET_AT_MS);
    expect(isLegacyCheckoutIdAccepted()).toBe(false);
    expect(resolvableCheckoutIdSchema.safeParse(LEGACY_UUID).success).toBe(
      false,
    );
  });

  it("rejects malformed ids", () => {
    vi.setSystemTime(CHECKOUT_ID_WKS_CUTOVER_AT_MS);
    expect(resolvableCheckoutIdSchema.safeParse("not-a-wks-id").success).toBe(
      false,
    );
    expect(resolvableCheckoutIdSchema.safeParse("LCWAB12CD34E").success).toBe(
      false,
    );
  });
});
