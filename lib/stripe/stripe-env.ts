/**
 * Stripe environment configuration for checkout fulfilment (LOC-1176 / PRD Task 4.1).
 *
 * Server-only — never import from client components. Hosted Checkout uses
 * `STRIPE_SECRET_KEY` only; `STRIPE_WEBHOOK_SECRET` is required for the
 * webhook route (LOC-1165). A publishable key is not needed for hosted Checkout.
 */

/** Env var for the Stripe secret API key (`sk_test_…` / `sk_live_…`). */
export const STRIPE_SECRET_KEY_ENV = "STRIPE_SECRET_KEY";

/** Env var for the Stripe webhook signing secret (`whsec_…`). */
export const STRIPE_WEBHOOK_SECRET_ENV = "STRIPE_WEBHOOK_SECRET";

/** Relative path for the Stripe webhook route (LOC-1165). */
export const STRIPE_WEBHOOK_ROUTE_PATH = "/api/stripe/webhook";

const STRIPE_PAYMENT_ENV_VARS = [STRIPE_SECRET_KEY_ENV] as const;

const STRIPE_WEBHOOK_ENV_VARS = [
  STRIPE_SECRET_KEY_ENV,
  STRIPE_WEBHOOK_SECRET_ENV,
] as const;

/**
 * Returns the trimmed Stripe secret key, or null when unset.
 */
export function getStripeSecretKey(): string | null {
  const key = process.env[STRIPE_SECRET_KEY_ENV]?.trim();
  return key || null;
}

/**
 * Returns the trimmed Stripe webhook signing secret, or null when unset.
 */
export function getStripeWebhookSecret(): string | null {
  const secret = process.env[STRIPE_WEBHOOK_SECRET_ENV]?.trim();
  return secret || null;
}

/**
 * Returns true when hosted Checkout / server Stripe API calls can run.
 */
export function hasStripePaymentEnv(): boolean {
  return getStripeSecretKey() !== null;
}

/**
 * Returns true when webhook signature verification can run.
 */
export function hasStripeWebhookEnv(): boolean {
  return (
    getStripeSecretKey() !== null && getStripeWebhookSecret() !== null
  );
}

/**
 * Lists missing env vars required for Pay initiation / hosted Checkout.
 */
export function getMissingStripePaymentEnvVars(): string[] {
  return STRIPE_PAYMENT_ENV_VARS.filter((name) => !process.env[name]?.trim());
}

/**
 * Lists missing env vars required for the Stripe webhook route.
 */
export function getMissingStripeWebhookEnvVars(): string[] {
  return STRIPE_WEBHOOK_ENV_VARS.filter((name) => !process.env[name]?.trim());
}
