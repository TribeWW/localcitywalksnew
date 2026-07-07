/**
 * buildStripeCheckoutCancelUrl — red/green TDD specs (LOC-1163 / PRD Task 3.5).
 *
 * Critical invariants:
 * - Cancel URL preserves the original handoff token (no re-mint)
 * - Includes checkout id + cancelled flag for server-side cleanup and UX banner
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildStripeCheckoutCancelUrl } from "@/lib/stripe/build-stripe-checkout-cancel-url";

describe("buildStripeCheckoutCancelUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.localcitywalks.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("preserves handoff token and adds checkout id with cancelled flag", () => {
    const url = buildStripeCheckoutCancelUrl({
      handoffToken: "header.payload.signature",
      checkoutId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(url).toBe(
      "https://www.localcitywalks.com/checkout?h=header.payload.signature&checkoutId=550e8400-e29b-41d4-a716-446655440000&cancelled=1",
    );
  });

  it("URL-encodes special characters in the handoff token", () => {
    const url = buildStripeCheckoutCancelUrl({
      handoffToken: "token+with/special=chars",
      checkoutId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(url).toContain(
      "h=token%2Bwith%2Fspecial%3Dchars",
    );
    expect(url).toContain("cancelled=1");
  });
});
