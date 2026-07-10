/**
 * checkout-origin — Stripe redirect origin resolution.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isAllowedPreviewCheckoutHost,
  resolveCheckoutOrigin,
  resolveCheckoutOriginFromHeaders,
  resolveProductionCheckoutOrigin,
} from "@/lib/stripe/checkout-origin";
import { SITE_URL } from "@/lib/site";

function headersFrom(
  values: Record<string, string>,
): Headers {
  return new Headers(values);
}

describe("isAllowedPreviewCheckoutHost", () => {
  it("allows Vercel preview hostnames", () => {
    expect(isAllowedPreviewCheckoutHost("localcitywalks-git-feature-abc.vercel.app")).toBe(
      true,
    );
  });

  it("allows localcitywalks staging and subdomains", () => {
    expect(isAllowedPreviewCheckoutHost("staging.localcitywalks.com")).toBe(true);
    expect(isAllowedPreviewCheckoutHost("www.localcitywalks.com")).toBe(true);
  });

  it("allows localhost with port", () => {
    expect(isAllowedPreviewCheckoutHost("localhost:3000")).toBe(true);
  });

  it("rejects unknown external hosts", () => {
    expect(isAllowedPreviewCheckoutHost("evil.example.com")).toBe(false);
  });
});

describe("resolveCheckoutOriginFromHeaders", () => {
  it("uses x-forwarded-host and x-forwarded-proto", () => {
    const origin = resolveCheckoutOriginFromHeaders(
      headersFrom({
        "x-forwarded-host": "staging.localcitywalks.com",
        "x-forwarded-proto": "https",
      }),
    );

    expect(origin).toBe("https://staging.localcitywalks.com");
  });

  it("falls back to host header", () => {
    const origin = resolveCheckoutOriginFromHeaders(
      headersFrom({ host: "localhost:3000" }),
    );

    expect(origin).toBe("https://localhost:3000");
  });

  it("returns null for disallowed hosts", () => {
    expect(
      resolveCheckoutOriginFromHeaders(
        headersFrom({ host: "attacker.example.com" }),
      ),
    ).toBeNull();
  });
});

describe("resolveProductionCheckoutOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.localcitywalks.com/");
    expect(resolveProductionCheckoutOrigin()).toBe("https://www.localcitywalks.com");
  });

  it("falls back to SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(resolveProductionCheckoutOrigin()).toBe(SITE_URL);
  });
});

describe("resolveCheckoutOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
  });

  it("pins production to SITE_URL even when VERCEL_URL is set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "localcitywalks-git-main.vercel.app");

    expect(
      resolveCheckoutOrigin({
        headers: headersFrom({ host: "localcitywalks-git-main.vercel.app" }),
      }),
    ).toBe(SITE_URL);
  });

  it("uses request host on preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "localcitywalks-git-feature.vercel.app");

    expect(
      resolveCheckoutOrigin({
        headers: headersFrom({
          "x-forwarded-host": "staging.localcitywalks.com",
          "x-forwarded-proto": "https",
        }),
      }),
    ).toBe("https://staging.localcitywalks.com");
  });

  it("falls back to VERCEL_URL on preview without headers", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "localcitywalks-git-feature.vercel.app");

    expect(resolveCheckoutOrigin()).toBe(
      "https://localcitywalks-git-feature.vercel.app",
    );
  });

  it("prefers NEXT_PUBLIC_SITE_URL on preview when set", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.localcitywalks.com");

    expect(
      resolveCheckoutOrigin({
        headers: headersFrom({ host: "other-branch.vercel.app" }),
      }),
    ).toBe("https://staging.localcitywalks.com");
  });
});
