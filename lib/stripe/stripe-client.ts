/**
 * Stripe SDK client for hosted Checkout Sessions (LOC-1161 / LOC-1176).
 *
 * Server-only — never import from client components. Returns null when
 * `STRIPE_SECRET_KEY` is missing so callers can fail safely in tests.
 */

import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/stripe/stripe-env";

/** Pinned API version for the installed `stripe` SDK (checkout + webhooks). */
export const STRIPE_API_VERSION = "2026-06-24.dahlia" as const;

let stripeClient: Stripe | null | undefined;

export { getStripeSecretKey } from "@/lib/stripe/stripe-env";

/**
 * Returns a singleton Stripe client, or null when the secret key is missing.
 */
export function getStripeClient(): Stripe | null {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
  return stripeClient;
}

/**
 * Clears the cached Stripe client — used by tests after env changes.
 */
export function resetStripeClientForTests(): void {
  stripeClient = undefined;
}

/**
 * Overrides the Stripe client for unit tests.
 *
 * @param client - Mock Stripe instance or null to simulate missing configuration
 */
export function setStripeClientForTests(client: Stripe | null): void {
  stripeClient = client;
}
