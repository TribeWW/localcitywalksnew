import posthog from "posthog-js";
import {
  markInternalOrTestUser,
  planInternalTrackingNavAction,
  resolveInternalTrackingState,
  searchFromUrl,
} from "@/lib/analytics/internal-tracking";
import { syncMeasurementConsent } from "@/lib/analytics/measurement-consent";
import {
  isSanityStudioPath,
  pathnameFromUrl,
} from "@/lib/analytics/studio-path";

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
  const onStudio = isSanityStudioPath(window.location.pathname);

  // Skip CMS: PostHog (and its chat widget) stay off /studio. Public-site only.
  // `?internal=off` also skips init — not the same as cookie-banner reject.
  if (!disabled && !onStudio) {
    startPostHog(markInternal);
  }
}

/**
 * Soft navigations do not re-run this module. Re-apply `?internal=` here, and
 * force a full document load when PostHog must start or stop (internal links or
 * entering / leaving Sanity Studio).
 */
export function onRouterTransitionStart(url: string) {
  if (!projectToken || !apiHost) return;

  const origin = window.location.origin;
  const targetPath = pathnameFromUrl(url, origin);
  const goingToStudio = isSanityStudioPath(targetPath);
  const onStudio = isSanityStudioPath(window.location.pathname);

  if (goingToStudio && posthogStarted) {
    window.location.replace(url);
    return;
  }

  if (!goingToStudio && onStudio && !posthogStarted) {
    const { disabled } = resolveInternalTrackingState(
      searchFromUrl(url, origin),
    );
    if (!disabled) {
      window.location.replace(url);
      return;
    }
  }

  const action = planInternalTrackingNavAction(
    searchFromUrl(url, origin),
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
