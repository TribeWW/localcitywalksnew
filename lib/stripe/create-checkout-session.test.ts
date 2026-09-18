/**
 * Stripe Checkout Session helpers — red/green TDD specs (LOC-1161).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHECKOUT_HANDOFF_TTL_SECONDS } from "@/lib/checkout/handoff-token";
import {
  buildStripeCheckoutRedirectUrls,
  buildStripeCheckoutSessionIdempotencyKey,
  createStripeCheckoutSession,
  quoteAmountToStripeMinorUnits,
  resolveStripeCheckoutExpiresAt,
} from "@/lib/stripe/create-checkout-session";

const checkoutSessionsCreateMock = vi.fn();

vi.mock("@/lib/stripe/stripe-client", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => checkoutSessionsCreateMock(...args),
      },
    },
  }),
}));

describe("quoteAmountToStripeMinorUnits", () => {
  it("converts EUR totals to cents", () => {
    expect(quoteAmountToStripeMinorUnits(496, "EUR")).toBe(49600);
  });

  it("keeps JPY as a zero-decimal currency", () => {
    expect(quoteAmountToStripeMinorUnits(1500, "JPY")).toBe(1500);
  });
});

describe("resolveStripeCheckoutExpiresAt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("expires within the 30-minute handoff TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T10:00:00.000Z"));

    const expiresAt = resolveStripeCheckoutExpiresAt();
    expect(expiresAt).toBe(
      Math.floor(Date.parse("2026-07-06T10:00:00.000Z") / 1000) +
        CHECKOUT_HANDOFF_TTL_SECONDS,
    );
  });
});

describe("buildStripeCheckoutRedirectUrls", () => {
  it("returns success and cancel URLs with preserved handoff and checkout id", () => {
    const urls = buildStripeCheckoutRedirectUrls(
      "signed.token.value",
      "WKSAB12CD34E",
    );

    expect(urls.successUrl).toContain("/checkout/success?session_id=");
    expect(urls.cancelUrl).toContain("/checkout?h=signed.token.value");
    expect(urls.cancelUrl).toContain(
      "checkoutId=WKSAB12CD34E",
    );
    expect(urls.cancelUrl).toContain("cancelled=1");
  });

  it("uses the provided checkout origin for success and cancel URLs", () => {
    const urls = buildStripeCheckoutRedirectUrls(
      "signed.token.value",
      "WKSAB12CD34E",
      "https://staging.localcitywalks.com",
    );

    expect(urls.successUrl).toBe(
      "https://staging.localcitywalks.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    );
    expect(urls.cancelUrl).toBe(
      "https://staging.localcitywalks.com/checkout?h=signed.token.value&checkoutId=WKSAB12CD34E&cancelled=1",
    );
  });
});

describe("createStripeCheckoutSession", () => {
  beforeEach(() => {
    checkoutSessionsCreateMock.mockReset();
    checkoutSessionsCreateMock.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.test/cs_test_123",
    });
  });

  it("creates a hosted session with metadata and expires_at", async () => {
    const result = await createStripeCheckoutSession({
      checkoutId: "WKSAB12CD34E",
      quote: {
        totalAmount: 496,
        currency: "EUR",
        source: "bokun-availability",
        breakdown: [],
      },
      customerEmail: "ada@example.com",
      productTitle: "Hello Biarritz",
      handoffToken: "signed.token",
    });

    expect(result).toEqual({
      success: true,
      data: {
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.test/cs_test_123",
      },
    });

    expect(checkoutSessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        customer_email: "ada@example.com",
        metadata: {
          checkoutId: "WKSAB12CD34E",
        },
        payment_intent_data: {
          metadata: {
            checkoutId: "WKSAB12CD34E",
          },
        },
        expires_at: expect.any(Number),
        line_items: [
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              currency: "eur",
              unit_amount: 49600,
            }),
          }),
        ],
      }),
      {
        idempotencyKey: buildStripeCheckoutSessionIdempotencyKey(
          "WKSAB12CD34E",
        ),
      },
    );
  });

  it("returns failure when Stripe omits session url", async () => {
    checkoutSessionsCreateMock.mockResolvedValue({
      id: "cs_test_123",
      url: null,
    });

    await expect(
      createStripeCheckoutSession({
        checkoutId: "WKSAB12CD34E",
        quote: {
          totalAmount: 496,
          currency: "EUR",
          source: "bokun-availability",
          breakdown: [],
        },
        customerEmail: "ada@example.com",
        productTitle: "Hello Biarritz",
        handoffToken: "signed.token",
      }),
    ).resolves.toEqual({ success: false });
  });
});
