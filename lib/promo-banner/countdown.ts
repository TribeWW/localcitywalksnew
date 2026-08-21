/**
 * promo-banner countdown helpers — pure time formatting for PromoBanner.
 */

import { isValid, parseISO } from "date-fns";

/** Remaining time segments until `endsAt`, or ended. */
export type PromoCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Splits the remaining time until `endsAt` into countdown segments.
 *
 * @param endsAtIso - Offer end instant (ISO)
 * @param nowMs - Clock epoch ms
 * @returns Segments when still running, or `null` when ended / invalid
 */
export function getPromoCountdownParts(
  endsAtIso: string,
  nowMs: number,
): PromoCountdownParts | null {
  const end = parseISO(endsAtIso);
  if (!isValid(end) || Number.isNaN(nowMs)) {
    return null;
  }

  const remainingMs = end.getTime() - nowMs;
  if (remainingMs <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Reduced-motion static end label: `Ends {d MMM}` in UTC.
 *
 * @param endsAtIso - Offer end instant (ISO)
 */
export function formatPromoEndsStaticLabel(endsAtIso: string): string {
  const end = parseISO(endsAtIso);
  if (!isValid(end)) {
    return "Offer ended";
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(end);

  return `Ends ${formatted}`;
}

/**
 * Pads hours/minutes/seconds to two digits; days stay unpadded.
 *
 * @param value - Segment integer
 * @param pad - Whether to zero-pad to width 2
 */
export function formatPromoCountdownDigit(
  value: number,
  pad: boolean,
): string {
  return pad ? String(value).padStart(2, "0") : String(value);
}
