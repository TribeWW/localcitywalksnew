/**
 * buildInitiateCheckoutPaymentInput — red/green TDD specs (LOC-1162 / PRD Task 3.4).
 *
 * Critical invariants:
 * - Maps summary contact + order total to `initiateCheckoutPayment` payload
 * - Requires explicit terms acceptance before Pay can proceed
 */

import { describe, expect, it } from "vitest";
import { buildInitiateCheckoutPaymentInput } from "@/lib/checkout/build-initiate-checkout-payment-input";

const contact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+34600000000",
  comments: "Near the cathedral",
};

describe("buildInitiateCheckoutPaymentInput", () => {
  it("maps summary contact, handoff token, and order total to payment input", () => {
    expect(
      buildInitiateCheckoutPaymentInput({
        handoffToken: "signed.handoff.token",
        contact,
        termsAccepted: true,
        clientQuote: { totalAmount: 496, currency: "EUR" },
      }),
    ).toEqual({
      handoffToken: "signed.handoff.token",
      contact: {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+34600000000",
        comments: "Near the cathedral",
      },
      termsAccepted: true,
      clientQuote: { totalAmount: 496, currency: "EUR" },
    });
  });

  it("omits blank optional contact fields from the payload", () => {
    expect(
      buildInitiateCheckoutPaymentInput({
        handoffToken: "signed.handoff.token",
        contact: {
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          phone: "",
          comments: "",
        },
        termsAccepted: true,
        clientQuote: { totalAmount: 496, currency: "EUR" },
      }),
    ).toEqual({
      handoffToken: "signed.handoff.token",
      contact: {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      },
      termsAccepted: true,
      clientQuote: { totalAmount: 496, currency: "EUR" },
    });
  });

  it("throws when terms are not accepted", () => {
    expect(() =>
      buildInitiateCheckoutPaymentInput({
        handoffToken: "signed.handoff.token",
        contact,
        termsAccepted: false,
        clientQuote: { totalAmount: 496, currency: "EUR" },
      }),
    ).toThrow("Terms must be accepted");
  });

  it("preserves trimmed comments for the Bókun activity booking note", () => {
    expect(
      buildInitiateCheckoutPaymentInput({
        handoffToken: "signed.handoff.token",
        contact: {
          ...contact,
          comments: "  Gluten-free tasting please  ",
        },
        termsAccepted: true,
        clientQuote: { totalAmount: 496, currency: "EUR" },
      }).contact.comments,
    ).toBe("Gluten-free tasting please");
  });

  it("preserves trimmed phone when product requires it", () => {
    expect(
      buildInitiateCheckoutPaymentInput({
        handoffToken: "signed.handoff.token",
        contact: {
          ...contact,
          phone: "  +34600000000  ",
        },
        termsAccepted: true,
        clientQuote: { totalAmount: 496, currency: "EUR" },
      }).contact.phone,
    ).toBe("+34600000000");
  });
});
