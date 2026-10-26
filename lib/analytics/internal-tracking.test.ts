import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INTERNAL_USER_STORAGE_KEY,
  TRACKING_DISABLED_STORAGE_KEY,
  getBrowserLocalStorage,
  markInternalOrTestUser,
  planInternalTrackingNavAction,
  resolveInternalTrackingState,
  searchFromUrl,
} from "./internal-tracking";

describe("resolveInternalTrackingState", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("disables tracking and clears the internal flag for ?internal=off", () => {
    window.localStorage.setItem(INTERNAL_USER_STORAGE_KEY, "true");

    expect(resolveInternalTrackingState("?internal=off")).toEqual({
      disabled: true,
      markInternal: false,
    });
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBe(
      "true",
    );
    expect(window.localStorage.getItem(INTERNAL_USER_STORAGE_KEY)).toBeNull();
  });

  it("keeps skipping init from the stored off flag without the parameter", () => {
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");

    expect(resolveInternalTrackingState("?utm_source=test")).toEqual({
      disabled: true,
      markInternal: false,
    });
  });

  it("enables tracking and stores the internal flag for ?internal=1", () => {
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");

    expect(resolveInternalTrackingState("?internal=1")).toEqual({
      disabled: false,
      markInternal: true,
    });
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(INTERNAL_USER_STORAGE_KEY)).toBe("true");
  });

  it("re-marks internal on later visits from the stored flag", () => {
    window.localStorage.setItem(INTERNAL_USER_STORAGE_KEY, "true");

    expect(resolveInternalTrackingState("")).toEqual({
      disabled: false,
      markInternal: true,
    });
  });

  it("ignores other values of the parameter", () => {
    expect(resolveInternalTrackingState("?internal=yes")).toEqual({
      disabled: false,
      markInternal: false,
    });
    expect(window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(INTERNAL_USER_STORAGE_KEY)).toBeNull();
  });

  it("honours ?internal=off when storage is unavailable", () => {
    expect(resolveInternalTrackingState("?internal=off", null)).toEqual({
      disabled: true,
      markInternal: false,
    });
  });

  it("honours ?internal=off when accessing localStorage throws", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });

    try {
      expect(getBrowserLocalStorage()).toBeNull();
      expect(resolveInternalTrackingState("?internal=off")).toEqual({
        disabled: true,
        markInternal: false,
      });
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "localStorage", descriptor);
      }
    }
  });
});

describe("markInternalOrTestUser", () => {
  it("calls PostHog's built-in internal / test user marker", () => {
    const setInternalOrTestUser = vi.fn();

    markInternalOrTestUser({ setInternalOrTestUser });

    expect(setInternalOrTestUser).toHaveBeenCalledTimes(1);
  });
});

describe("planInternalTrackingNavAction", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("ignores navigations without the internal parameter", () => {
    expect(planInternalTrackingNavAction("?utm=1", true)).toBe("none");
  });

  it("reloads when ?internal=off and PostHog is already running", () => {
    expect(planInternalTrackingNavAction("?internal=off", true)).toBe("reload");
  });

  it("does not reload when ?internal=off and PostHog never started", () => {
    expect(planInternalTrackingNavAction("?internal=off", false)).toBe("none");
  });

  it("reloads when ?internal=1 and PostHog was previously skipped", () => {
    window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    expect(planInternalTrackingNavAction("?internal=1", false)).toBe("reload");
  });

  it("marks internal when ?internal=1 and PostHog is already running", () => {
    expect(planInternalTrackingNavAction("?internal=1", true)).toBe(
      "mark_internal",
    );
  });
});

describe("searchFromUrl", () => {
  it("reads the query string from absolute and relative URLs", () => {
    expect(searchFromUrl("https://example.com/tours?internal=off")).toBe(
      "?internal=off",
    );
    expect(searchFromUrl("/paris?internal=1", "https://example.com")).toBe(
      "?internal=1",
    );
  });

  it("resolves query-only targets against the current URL", () => {
    expect(
      searchFromUrl("?internal=1", "https://example.com/tours/paris"),
    ).toBe("?internal=1");
  });
});
