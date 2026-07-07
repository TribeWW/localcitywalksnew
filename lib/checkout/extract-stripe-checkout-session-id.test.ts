/**
 * extractStripeCheckoutSessionId — red/green TDD specs (LOC-1164).
 */

import { describe, expect, it } from "vitest";
import { extractStripeCheckoutSessionId } from "@/lib/checkout/extract-stripe-checkout-session-id";

describe("extractStripeCheckoutSessionId", () => {
  it("extracts cs_test session id from hosted Checkout redirect URL", () => {
    expect(
      extractStripeCheckoutSessionId(
        "https://checkout.stripe.com/c/pay/cs_test_a1b2c3#fidkdWxOYHwnPyd1blpxYHZxWjA0",
      ),
    ).toBe("cs_test_a1b2c3");
  });

  it("returns null when URL does not contain a session id", () => {
    expect(extractStripeCheckoutSessionId("https://example.com/checkout")).toBe(
      null,
    );
  });
});
