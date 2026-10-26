import type { PostHog } from "posthog-js";

/**
 * Team links (any page):
 * - `?internal=off` — remember that PostHog must not start in this browser.
 * - `?internal=1` — clear the off switch and tag the person as an internal /
 *   test user so the existing PostHog filter excludes them from reports.
 *
 * The off switch is a localStorage flag checked before `posthog.init`. It is
 * separate from cookie-banner opt-out (cookieless counting after LOC-1421).
 */
export const INTERNAL_QUERY_PARAM = "internal";
export const TRACKING_DISABLED_STORAGE_KEY = "lcw_posthog_disabled";
export const INTERNAL_USER_STORAGE_KEY = "lcw_posthog_internal";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type InternalTrackingState = {
  /** When true, skip `posthog.init` entirely. */
  disabled: boolean;
  /** When true, call `setInternalOrTestUser` after init. */
  markInternal: boolean;
};

function readStorage(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(
  storage: StorageLike,
  key: string,
  value: string | null,
): void {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: query param still applies for this load.
  }
}

/**
 * Applies `?internal=1` / `?internal=off` for this page load and returns the
 * persisted state for the rest of client init.
 */
export function resolveInternalTrackingState(
  search: string = typeof window !== "undefined" ? window.location.search : "",
  storage: StorageLike | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): InternalTrackingState {
  const value = new URLSearchParams(search).get(INTERNAL_QUERY_PARAM);

  if (storage) {
    if (value === "off") {
      writeStorage(storage, TRACKING_DISABLED_STORAGE_KEY, "true");
      writeStorage(storage, INTERNAL_USER_STORAGE_KEY, null);
    } else if (value === "1") {
      writeStorage(storage, TRACKING_DISABLED_STORAGE_KEY, null);
      writeStorage(storage, INTERNAL_USER_STORAGE_KEY, "true");
    }
  }

  // Honour the query param even when storage is missing or blocked.
  if (value === "off") return { disabled: true, markInternal: false };
  if (value === "1") return { disabled: false, markInternal: true };

  const disabled =
    storage !== null &&
    readStorage(storage, TRACKING_DISABLED_STORAGE_KEY) === "true";
  const markInternal =
    !disabled &&
    storage !== null &&
    readStorage(storage, INTERNAL_USER_STORAGE_KEY) === "true";

  return { disabled, markInternal };
}

type InternalClient = Pick<PostHog, "setInternalOrTestUser">;

/** Marks the current PostHog person as an internal / test user. */
export function markInternalOrTestUser(client: InternalClient): void {
  client.setInternalOrTestUser();
}
