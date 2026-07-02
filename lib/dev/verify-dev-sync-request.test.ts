/**
 * verify-dev-sync-request — unit tests for dev sync route auth helper.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  devSyncUnauthorizedResponse,
  isDevSyncRequestAuthorized,
} from "@/lib/dev/verify-dev-sync-request";

describe("isDevSyncRequestAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows non-production when DEV_SYNC_TOKEN is unset", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DEV_SYNC_TOKEN", "");

    expect(
      isDevSyncRequestAuthorized(
        new Request("http://localhost/api/dev/publish-all-cities?confirm=yes"),
      ),
    ).toBe(true);
  });

  it("requires token in production when DEV_SYNC_TOKEN is set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DEV_SYNC_TOKEN", "secret-token");

    expect(
      isDevSyncRequestAuthorized(
        new Request(
          "https://example.com/api/dev/publish-all-cities?confirm=yes",
        ),
      ),
    ).toBe(false);

    expect(
      isDevSyncRequestAuthorized(
        new Request(
          "https://example.com/api/dev/publish-all-cities?confirm=yes&token=secret-token",
        ),
      ),
    ).toBe(true);
  });
});

describe("devSyncUnauthorizedResponse", () => {
  it("returns 401 with guidance", async () => {
    const res = devSyncUnauthorizedResponse();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("DEV_SYNC_TOKEN"),
    });
  });
});
