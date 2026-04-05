import { isValid, parseISO } from "date-fns";

/**
 * Format `experienceDate` for visitors: calendar date only, no clock time.
 * Uses the UTC calendar date of the stored instant so the label is stable across servers.
 */
export function formatExperienceDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
