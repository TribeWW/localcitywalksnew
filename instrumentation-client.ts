import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/**
 * Team links: `?internal=off` stops PostHog on this browser for good (init never
 * runs, so no later consent choice can turn it back on). `?internal=1` turns it
 * back on and tags the person so the test account filter excludes them.
 */
const INTERNAL_QUERY_PARAM = "internal";
const TRACKING_DISABLED_STORAGE_KEY = "lcw_posthog_disabled";

function applyInternalQueryParam(): { disabled: boolean; internal: boolean } {
  const value = new URLSearchParams(window.location.search).get(
    INTERNAL_QUERY_PARAM,
  );
  try {
    if (value === "off") {
      window.localStorage.setItem(TRACKING_DISABLED_STORAGE_KEY, "true");
    } else if (value === "1") {
      window.localStorage.removeItem(TRACKING_DISABLED_STORAGE_KEY);
    }
    return {
      disabled:
        window.localStorage.getItem(TRACKING_DISABLED_STORAGE_KEY) === "true",
      internal: value === "1",
    };
  } catch {
    return { disabled: value === "off", internal: value === "1" };
  }
}

if (!projectToken || !apiHost) {
  if (process.env.NODE_ENV === "development") {
    const missingVariable = !projectToken
      ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
      : "NEXT_PUBLIC_POSTHOG_HOST";
    console.warn(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This warning stops appearing once ${missingVariable} is configured`,
    );
  }
} else {
  const { disabled, internal } = applyInternalQueryParam();
  if (!disabled) {
    posthog.init(projectToken, {
      api_host: apiHost,
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    if (internal) {
      posthog.setPersonProperties({ $internal_or_test_user: true });
    }
  }
}
