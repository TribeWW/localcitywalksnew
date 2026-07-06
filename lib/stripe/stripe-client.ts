/**
 * Stripe SDK client for hosted Checkout Sessions (LOC-1161 / PRD Task 3.3).
 *
 * Server-only — never import from client components. Returns null when
 * `STRIPE_SECRET_KEY` is missing so callers can fail safely in tests.
 */

import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

/**
 * Reads the Stripe secret key from environment.
 */
export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

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

  stripeClient = new Stripe(secretKey);
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
