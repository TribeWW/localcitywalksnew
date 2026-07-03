/**
 * Checkout error copy — red/green TDD specs (LOC-1155).
 */

import { describe, expect, it } from "vitest";
import {
  CHECKOUT_SOLD_OUT_QUOTE_ERROR,
  classifyCheckoutQuoteUnavailableReason,
  resolveCheckoutHandoffErrorTitle,
  resolveCheckoutQuoteUnavailableMessage,
} from "./checkout-error-messages";

describe("classifyCheckoutQuoteUnavailableReason", () => {
  it("maps sold-out quote errors to sold_out", () => {
    expect(
      classifyCheckoutQuoteUnavailableReason(
        CHECKOUT_SOLD_OUT_QUOTE_ERROR,
        "quote",
      ),
    ).toBe("sold_out");
  });

  it("maps tour detail failures to tour_detail_unavailable", () => {
    expect(
      classifyCheckoutQuoteUnavailableReason("Tour not found", "tour_detail"),
    ).toBe("tour_detail_unavailable");
  });

  it("maps other quote errors to quote_error", () => {
    expect(
      classifyCheckoutQuoteUnavailableReason(
        "Unable to load availabilities",
        "quote",
      ),
    ).toBe("quote_error");
  });
});

describe("resolveCheckoutQuoteUnavailableMessage", () => {
  it("uses sold-out policy copy for unavailable slots", () => {
    expect(resolveCheckoutQuoteUnavailableMessage("sold_out")).toContain(
      "no longer available",
    );
  });

  it("uses tour detail copy when product metadata cannot load", () => {
    expect(
      resolveCheckoutQuoteUnavailableMessage("tour_detail_unavailable"),
    ).toContain("tour's details");
  });
});

describe("resolveCheckoutHandoffErrorTitle", () => {
  it("uses distinct titles for expired vs invalid links", () => {
    expect(resolveCheckoutHandoffErrorTitle("expired")).toMatch(/expired/i);
    expect(resolveCheckoutHandoffErrorTitle("invalid_signature")).toMatch(
      /invalid/i,
    );
  });
});
