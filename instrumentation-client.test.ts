import { afterEach, describe, expect, it, vi } from "vitest";

const posthogInit = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
  default: {
    init: posthogInit,
  },
}));

async function loadInstrumentationClient() {
  vi.resetModules();
  return import("./instrumentation-client");
}

describe("instrumentation-client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    posthogInit.mockReset();
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
      debug: true,
    });
  });
});
