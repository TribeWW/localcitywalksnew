/**
 * runCheckoutPayClick — red/green TDD specs (LOC-1162 / PRD Task 3.4).
 *
 * Critical invariants:
 * - Success returns Stripe redirect URL for client navigation
 * - Failure surfaces server error copy (sold-out vs generic)
 */

import { describe, expect, it, vi } from "vitest";
import { resolveCheckoutQuoteUnavailableMessage } from "@/lib/checkout/checkout-error-messages";
import { buildInitiateCheckoutPaymentInput } from "@/lib/checkout/build-initiate-checkout-payment-input";
import { runCheckoutPayClick } from "@/lib/checkout/run-checkout-pay-click";

const initiateCheckoutPaymentMock = vi.fn();

const paymentInput = buildInitiateCheckoutPaymentInput({
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
});

describe("runCheckoutPayClick", () => {
  it("returns redirect outcome when payment initiation succeeds", async () => {
    initiateCheckoutPaymentMock.mockResolvedValue({
      success: true,
      redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    await expect(
      runCheckoutPayClick(initiateCheckoutPaymentMock, paymentInput),
    ).resolves.toEqual({
      type: "redirect",
      redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    expect(initiateCheckoutPaymentMock).toHaveBeenCalledWith(paymentInput);
  });

  it("returns error outcome with sold-out copy on reserve failure", async () => {
    const soldOutMessage = resolveCheckoutQuoteUnavailableMessage("sold_out");
    initiateCheckoutPaymentMock.mockResolvedValue({
      success: false,
      error: soldOutMessage,
    });

    await expect(
      runCheckoutPayClick(initiateCheckoutPaymentMock, paymentInput),
    ).resolves.toEqual({
      type: "error",
      error: soldOutMessage,
    });
  });

  it("returns error outcome with generic payment failure copy", async () => {
    initiateCheckoutPaymentMock.mockResolvedValue({
      success: false,
      error: "Payment is not available right now. Please try again later.",
    });

    await expect(
      runCheckoutPayClick(initiateCheckoutPaymentMock, paymentInput),
    ).resolves.toEqual({
      type: "error",
      error: "Payment is not available right now. Please try again later.",
    });
  });
});
