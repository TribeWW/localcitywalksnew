/**
 * Checkout id generator + schema — WKS + 9 alphanumeric (LOC short external ref).
 */

import { describe, expect, it } from "vitest";

import {
  CHECKOUT_ID_PREFIX,
  CHECKOUT_ID_SUFFIX_LENGTH,
  checkoutIdSchema,
  generateCheckoutId,
} from "@/lib/checkout/checkout-id";

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
    expect(
      checkoutIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success,
    ).toBe(false);
    expect(checkoutIdSchema.safeParse("LCWAB12CD34E").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSab12cd34e").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSAB12CD34").success).toBe(false);
    expect(checkoutIdSchema.safeParse("WKSAB12CD34EX").success).toBe(false);
  });
});
