import { afterEach, describe, expect, it, vi } from "vitest";

const posthogInit = vi.hoisted(() => vi.fn());
const posthogSetPersonProperties = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
  default: {
    init: posthogInit,
    setPersonProperties: posthogSetPersonProperties,
  },
}));

const TRACKING_DISABLED_STORAGE_KEY = "lcw_posthog_disabled";

function stubPostHogEnv() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
}

function visit(search: string) {
  window.history.replaceState({}, "", `/${search}`);
}

async function loadInstrumentationClient() {
  vi.resetModules();
  return import("./instrumentation-client");
}

describe("instrumentation-client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    posthogInit.mockReset();
    posthogSetPersonProperties.mockReset();
    window.localStorage.clear();
    visit("");
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

  it("skips init and remembers the choice when ?internal=off is set", async () => {
    stubPostHogEnv();
    visit("?internal=off");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
  });

  it("keeps skipping init on later visits without the parameter", async () => {
    stubPostHogEnv();
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    visit("?utm_source=test");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
  });

  it("tags the person as internal when ?internal=1 is set", async () => {
    stubPostHogEnv();
    visit("?internal=1");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogSetPersonProperties).toHaveBeenCalledWith({
      $internal_or_test_user: true,
    });
  });

  it("turns tracking back on when ?internal=1 follows ?internal=off", async () => {
    stubPostHogEnv();
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    visit("?internal=1");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBeNull();
  });

  it("does not tag the person without the parameter", async () => {
    stubPostHogEnv();

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogSetPersonProperties).not.toHaveBeenCalled();
  });

  it("ignores other values of the parameter", async () => {
    stubPostHogEnv();
    visit("?internal=yes");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogSetPersonProperties).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBeNull();
  });
});
