/**
 * stripe-env — red/green TDD specs (LOC-1176 / PRD Task 4.1).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getMissingStripePaymentEnvVars,
  getMissingStripeWebhookEnvVars,
  getStripeSecretKey,
  getStripeWebhookSecret,
  hasStripePaymentEnv,
  hasStripeWebhookEnv,
  STRIPE_WEBHOOK_ROUTE_PATH,
} from "@/lib/stripe/stripe-env";

describe("stripe-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exposes the webhook route path for ops setup", () => {
    expect(STRIPE_WEBHOOK_ROUTE_PATH).toBe("/api/stripe/webhook");
  });

  it("reads payment env when STRIPE_SECRET_KEY is set", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");

    expect(getStripeSecretKey()).toBe("sk_test_abc");
    expect(hasStripePaymentEnv()).toBe(true);
    expect(getMissingStripePaymentEnvVars()).toEqual([]);
  });

  it("reports missing payment env when STRIPE_SECRET_KEY is unset", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    expect(getStripeSecretKey()).toBeNull();
    expect(hasStripePaymentEnv()).toBe(false);
    expect(getMissingStripePaymentEnvVars()).toEqual(["STRIPE_SECRET_KEY"]);
  });

  it("requires webhook secret for webhook env checks", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    expect(getStripeWebhookSecret()).toBe("whsec_test");
    expect(hasStripeWebhookEnv()).toBe(true);
    expect(getMissingStripeWebhookEnvVars()).toEqual([]);
  });

  it("reports missing webhook env vars", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");

    expect(hasStripeWebhookEnv()).toBe(false);
    expect(getMissingStripeWebhookEnvVars()).toEqual(["STRIPE_WEBHOOK_SECRET"]);
  });
});
