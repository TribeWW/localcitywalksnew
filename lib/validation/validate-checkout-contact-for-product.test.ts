/**
 * validate-checkout-contact-for-product — product-driven Pay-click contact checks.
 */

import { describe, expect, it } from "vitest";
import {
  validateCheckoutContactForProduct,
  resolveMissingCheckoutContactFieldMessage,
} from "@/lib/validation/validate-checkout-contact-for-product";
import type { CheckoutPaymentContact } from "@/lib/validation/checkout-payment";
import type { CheckoutContactRequirements } from "@/types/bokun";

const baseContact: CheckoutPaymentContact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

const allRequired: CheckoutContactRequirements = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
};

describe("resolveMissingCheckoutContactFieldMessage", () => {
  it("returns user-facing copy per checkout contact field", () => {
    expect(resolveMissingCheckoutContactFieldMessage("firstName")).toBe(
      "Please enter your first name",
    );
    expect(resolveMissingCheckoutContactFieldMessage("lastName")).toBe(
      "Please enter your last name",
    );
    expect(resolveMissingCheckoutContactFieldMessage("email")).toBe(
      "Please enter your email address",
    );
    expect(resolveMissingCheckoutContactFieldMessage("phone")).toBe(
      "Please enter your phone number",
    );
  });
});

describe("validateCheckoutContactForProduct", () => {
  it("accepts contact that satisfies all required fields", () => {
    expect(
      validateCheckoutContactForProduct(
        { ...baseContact, phone: "+34600000000" },
        allRequired,
      ),
    ).toEqual({ success: true });
  });

  it("rejects missing phone when the product requires it", () => {
    expect(
      validateCheckoutContactForProduct(baseContact, allRequired),
    ).toEqual({
      success: false,
      error: "Please enter your phone number",
    });
  });

  it("rejects whitespace-only phone when the product requires it", () => {
    expect(
      validateCheckoutContactForProduct(
        { ...baseContact, phone: "   " },
        allRequired,
      ),
    ).toEqual({
      success: false,
      error: "Please enter your phone number",
    });
  });

  it("allows missing phone when the product marks it optional", () => {
    expect(
      validateCheckoutContactForProduct(baseContact, {
        ...allRequired,
        phone: false,
      }),
    ).toEqual({ success: true });
  });

  it("rejects missing first name when the product marks it required", () => {
    expect(
      validateCheckoutContactForProduct(
        { ...baseContact, firstName: "" },
        allRequired,
      ),
    ).toEqual({
      success: false,
      error: "Please enter your first name",
    });
  });

  it("allows missing first name when the product marks it optional", () => {
    expect(
      validateCheckoutContactForProduct(
        { ...baseContact, firstName: "" },
        { ...allRequired, firstName: false, phone: false },
      ),
    ).toEqual({ success: true });
  });
});
