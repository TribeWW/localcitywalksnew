/**
 * checkout-pay-integration-env — red/green TDD specs (LOC-1164 / PRD Task 3.6).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHECKOUT_PAY_INTEGRATION_ENV_FLAG,
  getMissingCheckoutPayIntegrationEnvVars,
  hasCheckoutPayIntegrationEnv,
  isCheckoutPayIntegrationEnabled,
} from "@/lib/checkout/checkout-pay-integration-env";

describe("checkout-pay-integration-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires RUN_CHECKOUT_INTEGRATION_TESTS=true to enable live tests", () => {
    vi.stubEnv(CHECKOUT_PAY_INTEGRATION_ENV_FLAG, "");
    expect(isCheckoutPayIntegrationEnabled()).toBe(false);

    vi.stubEnv(CHECKOUT_PAY_INTEGRATION_ENV_FLAG, "true");
    expect(isCheckoutPayIntegrationEnabled()).toBe(true);
  });

  it("lists missing Bókun, handoff, KV, and Stripe env vars", () => {
    vi.stubEnv("BOKUN_ACCESS_KEY", "");
    vi.stubEnv("BOKUN_SECRET_KEY", "secret");
    vi.stubEnv("BOKUN_DOMAIN", "localcitywalks");
    vi.stubEnv("BOKUN_USE_TEST", "false");
    vi.stubEnv("CHECKOUT_HANDOFF_SECRET", "x".repeat(32));
    vi.stubEnv("KV_REST_API_URL", "https://kv.example");
    vi.stubEnv("KV_REST_API_TOKEN", "token");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");

    expect(getMissingCheckoutPayIntegrationEnvVars()).toEqual([
      "BOKUN_ACCESS_KEY",
      "BOKUN_USE_TEST",
    ]);
    expect(hasCheckoutPayIntegrationEnv()).toBe(false);
  });

  it("accepts Upstash Redis env aliases for KV credentials", () => {
    vi.stubEnv("BOKUN_ACCESS_KEY", "key");
    vi.stubEnv("BOKUN_SECRET_KEY", "secret");
    vi.stubEnv("BOKUN_DOMAIN", "localcitywalks");
    vi.stubEnv("BOKUN_USE_TEST", "true");
    vi.stubEnv("CHECKOUT_HANDOFF_SECRET", "x".repeat(32));
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://kv.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");

    expect(hasCheckoutPayIntegrationEnv()).toBe(true);
  });
});
