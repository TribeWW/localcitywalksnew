import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INTERNAL_USER_STORAGE_KEY,
  TRACKING_DISABLED_STORAGE_KEY,
  markInternalOrTestUser,
  resolveInternalTrackingState,
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
});

describe("markInternalOrTestUser", () => {
  it("calls PostHog's built-in internal / test user marker", () => {
    const setInternalOrTestUser = vi.fn();

    markInternalOrTestUser({ setInternalOrTestUser });

    expect(setInternalOrTestUser).toHaveBeenCalledTimes(1);
  });
});
