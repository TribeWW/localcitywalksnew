import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IUBENDA_PREFERENCE_EVENT,
  IUBENDA_PREFERENCE_KEY,
} from "@/lib/analytics/measurement-consent";

const posthogMock = vi.hoisted(() => {
  let status: "granted" | "denied" | "pending" = "pending";
  return {
    init: vi.fn(),
    get_explicit_consent_status: vi.fn(() => status),
    opt_in_capturing: vi.fn(() => {
      status = "granted";
    }),
    opt_out_capturing: vi.fn(() => {
      status = "denied";
    }),
    resetStatus: () => {
      status = "pending";
    },
  };
});
const posthogInit = posthogMock.init;

vi.mock("posthog-js", () => ({
  default: posthogMock,
}));

function stubConfiguredEnv() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
}

function expressPreference(preference: unknown) {
  window.dispatchEvent(
    new CustomEvent(IUBENDA_PREFERENCE_EVENT, { detail: preference }),
  );
}

async function loadInstrumentationClient() {
  vi.resetModules();
  return import("./instrumentation-client");
}

describe("instrumentation-client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    posthogInit.mockReset();
    posthogMock.resetStatus();
    delete (window as unknown as Record<string, unknown>)[
      IUBENDA_PREFERENCE_KEY
    ];
  });

  it("warns in development and skips init when PostHog env is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(loadInstrumentationClient()).resolves.toBeTruthy();

    expect(posthogInit).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"),
    );
    warn.mockRestore();
  });

  it("skips init without a warning when PostHog env is missing outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(loadInstrumentationClient()).resolves.toBeTruthy();

    expect(posthogInit).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("initializes PostHog when the project token and API host are configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledWith("phc_test", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      cookieless_mode: "on_reject",
      debug: true,
    });
  });

  it("stays cookieless while the visitor has not chosen", async () => {
    stubConfiguredEnv();

    await loadInstrumentationClient();

    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("opts in when the banner accepts Measurement", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "1": true, "4": true } });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("opts out when the banner rejects Measurement", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "1": true, "4": false } });

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
  });

  it("applies a returning visitor's stored choice that iubenda reported before init", async () => {
    stubConfiguredEnv();
    (window as unknown as Record<string, unknown>)[IUBENDA_PREFERENCE_KEY] = {
      preference: { purposes: { "4": false } },
    };

    await loadInstrumentationClient();

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
  });

  it("follows a later change from the cookie settings link", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "4": true } });
    expressPreference({ purposes: { "4": false } });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(
      posthogMock.opt_out_capturing.mock.invocationCallOrder[0],
    ).toBeGreaterThan(posthogMock.opt_in_capturing.mock.invocationCallOrder[0]);
  });

  it("does not re-apply the same choice on every page view", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "4": true } });
    expressPreference({ purposes: { "4": true } });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
  });
});
