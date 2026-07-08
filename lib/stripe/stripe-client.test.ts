/**
 * stripe-client — red/green TDD specs (LOC-1176 / PRD Task 4.1).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getStripeClient,
  resetStripeClientForTests,
  STRIPE_API_VERSION,
} from "@/lib/stripe/stripe-client";

describe("getStripeClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetStripeClientForTests();
  });

  it("returns null when STRIPE_SECRET_KEY is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    expect(getStripeClient()).toBeNull();
  });

  it("returns a singleton client pinned to the SDK API version", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");

    const first = getStripeClient();
    const second = getStripeClient();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(first?.getApiField("version")).toBe(STRIPE_API_VERSION);
  });
});
