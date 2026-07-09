/**
 * Stripe hosted Checkout Session creation for tour payments (LOC-1161).
 *
 * One-time `mode: 'payment'` session with `expires_at` aligned to the 30-minute
 * Bókun reserve / handoff TTL. Omits `payment_method_types` per Stripe best practice.
 */

import { CHECKOUT_HANDOFF_TTL_SECONDS } from "@/lib/checkout/handoff-token";
import { buildStripeCheckoutCancelUrl } from "@/lib/stripe/build-stripe-checkout-cancel-url";
import { getStripeClient } from "@/lib/stripe/stripe-client";
import { resolveCheckoutOrigin } from "@/lib/stripe/checkout-origin";
import type { BookingWidgetQuote } from "@/types/bokun";

/** ISO 4217 codes billed in major units (not cents) by Stripe. */
const STRIPE_ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/** Inputs for creating a hosted Stripe Checkout Session. */
export interface CreateStripeCheckoutSessionInput {
  checkoutId: string;
  quote: BookingWidgetQuote;
  customerEmail: string;
  productTitle: string;
  /** Encoded handoff token for cancel redirect (`/checkout?h=…`). */
  handoffToken: string;
}

export type CreateStripeCheckoutSessionResult =
  | { success: true; data: { sessionId: string; url: string } }
  | { success: false };

/**
 * Converts a server quote total to Stripe minor units (e.g. cents for EUR).
 *
 * @param amount - Major-unit total from Bókun quote
 * @param currency - ISO 4217 currency code
 */
export function quoteAmountToStripeMinorUnits(
  amount: number,
  currency: string,
): number {
  const normalized = currency.toUpperCase();
  if (STRIPE_ZERO_DECIMAL_CURRENCIES.has(normalized)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

/**
 * Computes Stripe Checkout Session `expires_at` capped at handoff TTL.
 */
export function resolveStripeCheckoutExpiresAt(): number {
  return Math.floor(Date.now() / 1000) + CHECKOUT_HANDOFF_TTL_SECONDS;
}

/**
 * Builds success and cancel URLs for a hosted Checkout Session.
 *
 * Cancel URL **preserves** the handoff token (no re-mint) and includes the
 * pending checkout id for Bókun reserve cleanup — see {@link buildStripeCheckoutCancelUrl}.
 *
 * @param handoffToken - Raw handoff token for cancel return to summary
 * @param checkoutId - Internal checkout uuid for cancel cleanup
 */
export function buildStripeCheckoutRedirectUrls(
  handoffToken: string,
  checkoutId: string,
): {
  successUrl: string;
  cancelUrl: string;
} {
  const origin = resolveCheckoutOrigin();

  return {
    successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: buildStripeCheckoutCancelUrl({ handoffToken, checkoutId }),
  };
}

/**
 * Stripe idempotency key for Checkout Session create — one session per checkout id.
 *
 * @param checkoutId - Internal pending-checkout uuid
 */
export function buildStripeCheckoutSessionIdempotencyKey(
  checkoutId: string,
): string {
  return `checkout-session-${checkoutId}`;
}

/**
 * Creates a hosted Stripe Checkout Session for a pending checkout row.
 *
 * @param input - Checkout id, verified quote, customer email, and handoff token
 */
export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutSessionInput,
): Promise<CreateStripeCheckoutSessionResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    console.error("[stripe-checkout] STRIPE_SECRET_KEY is not configured");
    return { success: false };
  }

  const { successUrl, cancelUrl } = buildStripeCheckoutRedirectUrls(
    input.handoffToken,
    input.checkoutId,
  );
  const currency = input.quote.currency.toLowerCase();

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: input.customerEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: quoteAmountToStripeMinorUnits(
                input.quote.totalAmount,
                input.quote.currency,
              ),
              product_data: {
                name: input.productTitle,
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_at: resolveStripeCheckoutExpiresAt(),
        metadata: {
          checkoutId: input.checkoutId,
        },
        payment_intent_data: {
          metadata: {
            checkoutId: input.checkoutId,
          },
        },
      },
      {
        idempotencyKey: buildStripeCheckoutSessionIdempotencyKey(
          input.checkoutId,
        ),
      },
    );

    if (!session.url || !session.id) {
      console.error(
        `[stripe-checkout] session missing url/id for checkout ${input.checkoutId}`,
      );
      return { success: false };
    }

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[stripe-checkout] session create failed for checkout ${input.checkoutId}: ${message}`,
    );
    return { success: false };
  }
}
