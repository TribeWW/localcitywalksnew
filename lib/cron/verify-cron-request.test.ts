/**
 * verify-cron-request — unit tests for Vercel Cron route auth helper.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cronUnauthorizedResponse,
  isCronRequestAuthorized,
} from "@/lib/cron/verify-cron-request";

describe("isCronRequestAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when CRON_SECRET is unset", () => {
    vi.stubEnv("CRON_SECRET", "");

    expect(
      isCronRequestAuthorized(
        new Request("http://localhost/api/cron/sync-bokun-catalog", {
          headers: { authorization: "Bearer any-token" },
        }),
      ),
    ).toBe(false);
  });

  it("rejects when Authorization header is missing or wrong", () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");

    expect(
      isCronRequestAuthorized(
        new Request("http://localhost/api/cron/sync-bokun-catalog"),
      ),
    ).toBe(false);

    expect(
      isCronRequestAuthorized(
        new Request("http://localhost/api/cron/sync-bokun-catalog", {
          headers: { authorization: "Bearer wrong-token" },
        }),
      ),
    ).toBe(false);
  });

  it("allows when Authorization Bearer matches CRON_SECRET", () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");

    expect(
      isCronRequestAuthorized(
        new Request("http://localhost/api/cron/sync-bokun-catalog", {
          headers: { authorization: "Bearer cron-secret" },
        }),
      ),
    ).toBe(true);
  });
});

describe("cronUnauthorizedResponse", () => {
  it("returns 401 with guidance", async () => {
    const res = cronUnauthorizedResponse();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("CRON_SECRET"),
    });
  });
});
