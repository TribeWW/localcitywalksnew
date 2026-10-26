import posthog from "posthog-js";
import {
  markInternalOrTestUser,
  planInternalTrackingNavAction,
  resolveInternalTrackingState,
  searchFromUrl,
} from "@/lib/analytics/internal-tracking";
import { syncMeasurementConsent } from "@/lib/analytics/measurement-consent";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** True after a successful `posthog.init` on this page document. */
let posthogStarted = false;

function startPostHog(markInternal: boolean) {
  if (!projectToken || !apiHost) return;

  // Cookieless until the iubenda Measurement purpose is accepted.
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    cookieless_mode: "on_reject",
    debug: process.env.NODE_ENV === "development",
  });
  posthogStarted = true;
  syncMeasurementConsent(posthog);
  if (markInternal) {
    markInternalOrTestUser(posthog);
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
  const { disabled, markInternal } = resolveInternalTrackingState();

  // `?internal=off` (and its stored flag) skip init entirely — not the same as
  // cookie-banner reject, which uses cookieless counting via opt_out_capturing.
  if (!disabled) {
    startPostHog(markInternal);
  }
}

/**
 * Soft navigations do not re-run this module. Re-apply `?internal=` here, and
 * force a full document load when PostHog must start or stop for that browser.
 */
export function onRouterTransitionStart(url: string) {
  if (!projectToken || !apiHost) return;

  const action = planInternalTrackingNavAction(
    searchFromUrl(url, window.location.origin),
    posthogStarted,
  );

  if (action === "reload") {
    window.location.replace(url);
    return;
  }
  if (action === "mark_internal") {
    markInternalOrTestUser(posthog);
  }
}
