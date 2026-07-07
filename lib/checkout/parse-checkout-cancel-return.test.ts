/**
 * parseCheckoutCancelReturn — red/green TDD specs (LOC-1163 / PRD Task 3.5).
 *
 * Critical invariants:
 * - Stripe cancel return is detected only when `cancelled=1` and checkout id is present
 * - Invalid or missing checkout ids are ignored (summary still loads from handoff)
 */

import { describe, expect, it } from "vitest";
import { parseCheckoutCancelReturn } from "@/lib/checkout/parse-checkout-cancel-return";

const CHECKOUT_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("parseCheckoutCancelReturn", () => {
  it("detects a Stripe cancel return with checkout id", () => {
    expect(
      parseCheckoutCancelReturn({
        cancelled: "1",
        checkoutId: CHECKOUT_ID,
      }),
    ).toEqual({
      isPaymentCancelled: true,
      checkoutId: CHECKOUT_ID,
    });
  });

  it("ignores cancel flag without a valid checkout id", () => {
    expect(
      parseCheckoutCancelReturn({
        cancelled: "1",
        checkoutId: "not-a-uuid",
      }),
    ).toEqual({
      isPaymentCancelled: false,
    });
  });

  it("ignores checkout id when cancel flag is absent", () => {
    expect(
      parseCheckoutCancelReturn({
        checkoutId: CHECKOUT_ID,
      }),
    ).toEqual({
      isPaymentCancelled: false,
    });
  });
});
