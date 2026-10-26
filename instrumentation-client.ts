import posthog from "posthog-js";
import {
  markInternalOrTestUser,
  resolveInternalTrackingState,
} from "@/lib/analytics/internal-tracking";
import { syncMeasurementConsent } from "@/lib/analytics/measurement-consent";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

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
    // Cookieless until the iubenda Measurement purpose is accepted.
    posthog.init(projectToken, {
      api_host: apiHost,
      defaults: "2026-01-30",
      capture_exceptions: true,
      cookieless_mode: "on_reject",
      debug: process.env.NODE_ENV === "development",
    });
    syncMeasurementConsent(posthog);
    if (markInternal) {
      markInternalOrTestUser(posthog);
    }
  }
}
