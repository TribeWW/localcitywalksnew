import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INTERNAL_USER_STORAGE_KEY,
  TRACKING_DISABLED_STORAGE_KEY,
} from "@/lib/analytics/internal-tracking";
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
    startSessionRecording: vi.fn(),
    setInternalOrTestUser: vi.fn(),
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

function visit(pathAndSearch: string) {
  const path = pathAndSearch.startsWith("/")
    ? pathAndSearch
    : `/${pathAndSearch}`;
  window.history.replaceState({}, "", path);
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
    vi.unstubAllGlobals();
    posthogInit.mockReset();
    posthogMock.opt_in_capturing.mockReset();
    posthogMock.opt_out_capturing.mockReset();
    posthogMock.startSessionRecording.mockReset();
    posthogMock.setInternalOrTestUser.mockReset();
    posthogMock.resetStatus();
    window.localStorage.clear();
    visit("");
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
    expect(posthogMock.startSessionRecording).not.toHaveBeenCalled();
  });

  it("opts in and starts session recording on the same page when Measurement is accepted", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "1": true, "4": true } });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.startSessionRecording).toHaveBeenCalledTimes(1);
    expect(
      posthogMock.startSessionRecording.mock.invocationCallOrder[0],
    ).toBeGreaterThan(posthogMock.opt_in_capturing.mock.invocationCallOrder[0]);
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("opts out when the banner rejects Measurement", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "1": true, "4": false } });

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthogMock.startSessionRecording).not.toHaveBeenCalled();
  });

  it("applies a returning visitor's stored choice that iubenda reported before init", async () => {
    stubConfiguredEnv();
    (window as unknown as Record<string, unknown>)[IUBENDA_PREFERENCE_KEY] = {
      preference: { purposes: { "4": false } },
    };

    await loadInstrumentationClient();

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthogMock.startSessionRecording).not.toHaveBeenCalled();
  });

  it("starts session recording when a returning visitor's stored Accept is applied at init", async () => {
    stubConfiguredEnv();
    (window as unknown as Record<string, unknown>)[IUBENDA_PREFERENCE_KEY] = {
      preference: { purposes: { "4": true } },
    };

    await loadInstrumentationClient();

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.startSessionRecording).toHaveBeenCalledTimes(1);
    expect(
      posthogMock.startSessionRecording.mock.invocationCallOrder[0],
    ).toBeGreaterThan(posthogMock.opt_in_capturing.mock.invocationCallOrder[0]);
  });

  it("follows a later change from the cookie settings link", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();

    expressPreference({ purposes: { "4": true } });
    expressPreference({ purposes: { "4": false } });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.startSessionRecording).toHaveBeenCalledTimes(1);
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
    expect(posthogMock.startSessionRecording).toHaveBeenCalledTimes(1);
  });

  it("skips init on Sanity Studio routes", async () => {
    stubConfiguredEnv();
    visit("/studio");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
  });

  it("skips init on nested Sanity Studio routes", async () => {
    stubConfiguredEnv();
    visit("/studio/structure");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
  });

  it("skips init and remembers the choice when ?internal=off is set", async () => {
    stubConfiguredEnv();
    visit("?internal=off");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
  });

  it("keeps skipping init on later visits after ?internal=off", async () => {
    stubConfiguredEnv();
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    visit("?utm_source=test");

    await loadInstrumentationClient();

    expect(posthogInit).not.toHaveBeenCalled();
  });

  it("never starts PostHog after ?internal=off, so a later Accept cannot turn it on", async () => {
    stubConfiguredEnv();
    visit("?internal=off");
    await loadInstrumentationClient();

    // Consent sync is only registered inside the init path. Skipping init is
    // what keeps a later banner Accept from starting PostHog in this browser.
    expect(posthogInit).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
  });

  it("tags the person as internal when ?internal=1 is set", async () => {
    stubConfiguredEnv();
    visit("?internal=1");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogMock.setInternalOrTestUser).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(INTERNAL_USER_STORAGE_KEY)).toBe("true");
  });

  it("turns tracking back on when ?internal=1 follows ?internal=off", async () => {
    stubConfiguredEnv();
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    visit("?internal=1");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBeNull();
    expect(posthogMock.setInternalOrTestUser).toHaveBeenCalledTimes(1);
  });

  it("re-tags internal from the stored flag without the parameter", async () => {
    stubConfiguredEnv();
    window.localStorage.setItem(INTERNAL_USER_STORAGE_KEY, "true");

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogMock.setInternalOrTestUser).toHaveBeenCalledTimes(1);
  });

  it("does not tag the person without the internal parameter or flag", async () => {
    stubConfiguredEnv();

    await loadInstrumentationClient();

    expect(posthogInit).toHaveBeenCalledTimes(1);
    expect(posthogMock.setInternalOrTestUser).not.toHaveBeenCalled();
  });

  it("forces a full reload on soft navigation to ?internal=off after PostHog started", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    const replace = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/tours",
      origin: "http://localhost",
      pathname: "/tours",
      replace,
      assign,
    });

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/tours?internal=off", "replace");

    expect(replace).toHaveBeenCalledWith("/tours?internal=off");
    expect(assign).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
    vi.unstubAllGlobals();
  });

  it("uses assign for push navigations so the previous page stays in history", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    const replace = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/",
      origin: "http://localhost",
      pathname: "/",
      replace,
      assign,
    });

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/studio", "push");

    expect(assign).toHaveBeenCalledWith("/studio");
    expect(replace).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("marks internal on soft navigation to ?internal=1 while PostHog is running", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    posthogMock.setInternalOrTestUser.mockClear();

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/?internal=1");

    expect(posthogMock.setInternalOrTestUser).toHaveBeenCalledTimes(1);
  });

  it("ignores soft navigations without the internal parameter", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    const replace = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/",
      origin: "http://localhost",
      pathname: "/",
      replace,
    });
    posthogMock.setInternalOrTestUser.mockClear();

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/paris");

    expect(replace).not.toHaveBeenCalled();
    expect(posthogMock.setInternalOrTestUser).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("forces a full reload when soft-navigating into /studio with PostHog running", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    const replace = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/",
      origin: "http://localhost",
      pathname: "/",
      replace,
    });

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/studio", "replace");

    expect(replace).toHaveBeenCalledWith("/studio");
    vi.unstubAllGlobals();
  });

  it("forces a full reload when leaving /studio so PostHog can start on the public site", async () => {
    stubConfiguredEnv();
    visit("/studio");
    await loadInstrumentationClient();
    expect(posthogInit).not.toHaveBeenCalled();

    const replace = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/studio",
      origin: "http://localhost",
      pathname: "/studio",
      replace,
      assign: vi.fn(),
    });

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("/tours", "push");

    expect(window.location.assign).toHaveBeenCalledWith("/tours");
    expect(replace).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps the current pathname when soft-navigating with a query-only internal link", async () => {
    stubConfiguredEnv();
    await loadInstrumentationClient();
    const replace = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost/tours/paris",
      origin: "http://localhost",
      pathname: "/tours/paris",
      replace,
      assign: vi.fn(),
    });

    const { onRouterTransitionStart } = await import("./instrumentation-client");
    onRouterTransitionStart("?internal=off", "replace");

    expect(replace).toHaveBeenCalledWith("?internal=off");
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
    vi.unstubAllGlobals();
  });
});
