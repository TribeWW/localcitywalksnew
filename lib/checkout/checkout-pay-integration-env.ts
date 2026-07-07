/**
 * Environment gate for checkout Pay initiation integration tests (LOC-1164).
 *
 * Live tests call Bókun test (`15686`), Upstash KV, and Stripe test keys. They
 * are opt-in via `RUN_CHECKOUT_INTEGRATION_TESTS=true` so CI stays fast.
 */

/** Env flag that must be `true` to run live Pay initiation integration tests. */
export const CHECKOUT_PAY_INTEGRATION_ENV_FLAG =
  "RUN_CHECKOUT_INTEGRATION_TESTS";

/** Required env vars for Bókun + handoff signing (KV checked separately). */
export const CHECKOUT_PAY_INTEGRATION_CORE_ENV_VARS = [
  "BOKUN_ACCESS_KEY",
  "BOKUN_SECRET_KEY",
  "BOKUN_DOMAIN",
  "BOKUN_USE_TEST",
  "CHECKOUT_HANDOFF_SECRET",
  "STRIPE_SECRET_KEY",
] as const;

/**
 * Returns true when live integration tests are explicitly enabled.
 */
export function isCheckoutPayIntegrationEnabled(): boolean {
  return process.env[CHECKOUT_PAY_INTEGRATION_ENV_FLAG] === "true";
}

/**
 * Returns true when Upstash / Vercel KV REST credentials are configured.
 */
export function hasCheckoutPayIntegrationKvEnv(): boolean {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  return Boolean(url && token);
}

/**
 * Lists missing env vars required for live Pay initiation integration tests.
 */
export function getMissingCheckoutPayIntegrationEnvVars(): string[] {
  const missing: string[] = [];

  for (const name of CHECKOUT_PAY_INTEGRATION_CORE_ENV_VARS) {
    if (name === "BOKUN_USE_TEST") {
      if (process.env.BOKUN_USE_TEST !== "true") {
        missing.push(name);
      }
      continue;
    }

    if (!process.env[name]?.trim()) {
      missing.push(name);
    }
  }

  if (!hasCheckoutPayIntegrationKvEnv()) {
    missing.push("KV_REST_API_URL + KV_REST_API_TOKEN");
  }

  return missing;
}

/**
 * Returns true when all integration prerequisites are present.
 */
export function hasCheckoutPayIntegrationEnv(): boolean {
  return getMissingCheckoutPayIntegrationEnvVars().length === 0;
}

/**
 * Returns true when live integration tests can run (flag + env).
 */
export function shouldRunCheckoutPayIntegrationTests(): boolean {
  return (
    isCheckoutPayIntegrationEnabled() && hasCheckoutPayIntegrationEnv()
  );
}
