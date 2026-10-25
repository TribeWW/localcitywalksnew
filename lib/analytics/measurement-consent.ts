import type { PostHog } from "posthog-js";

/** iubenda purpose ID for "Measurement" (analytics). */
export const IUBENDA_MEASUREMENT_PURPOSE_ID = "4";

/**
 * The iubenda callbacks in `app/layout.tsx` can fire before PostHog loads, so
 * they keep the last preference on `window` and also dispatch an event.
 */
export const IUBENDA_PREFERENCE_KEY = "__lcwIubendaPreference";
export const IUBENDA_PREFERENCE_EVENT = "lcw:iubenda-preference";

type IubendaPreference = {
  consent?: unknown;
  purposes?: Record<string, unknown>;
};

type BufferedPreference = { preference?: unknown };

type ConsentClient = Pick<
  PostHog,
  "get_explicit_consent_status" | "opt_in_capturing" | "opt_out_capturing"
>;

/** Inline script body that records iubenda preferences for `syncMeasurementConsent`. */
export const iubendaPreferenceCallback = `function (preference) {
  window[${JSON.stringify(IUBENDA_PREFERENCE_KEY)}] = { preference: preference };
  window.dispatchEvent(new CustomEvent(${JSON.stringify(IUBENDA_PREFERENCE_EVENT)}, { detail: preference }));
}`;

export function hasMeasurementConsent(preference: unknown): boolean {
  // iubenda passes no preference when consent is not needed (GDPR does not apply).
  if (preference === undefined || preference === null) return true;
  if (typeof preference !== "object") return false;

  const { consent, purposes } = preference as IubendaPreference;
  if (purposes && typeof purposes === "object") {
    return purposes[IUBENDA_MEASUREMENT_PURPOSE_ID] === true;
  }
  return consent === true;
}

export function applyMeasurementConsent(
  client: ConsentClient,
  granted: boolean,
) {
  const status = client.get_explicit_consent_status();
  if (granted && status !== "granted") client.opt_in_capturing();
  if (!granted && status !== "denied") client.opt_out_capturing();
}

export function syncMeasurementConsent(
  client: ConsentClient,
  target: Window = window,
) {
  const handle = (preference: unknown) =>
    applyMeasurementConsent(client, hasMeasurementConsent(preference));

  target.addEventListener(IUBENDA_PREFERENCE_EVENT, (event) =>
    handle((event as CustomEvent).detail),
  );

  const buffered = (target as unknown as Record<string, unknown>)[
    IUBENDA_PREFERENCE_KEY
  ] as BufferedPreference | undefined;
  if (buffered) handle(buffered.preference);
}
