import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Removes diacritical marks (accents) from a string.
 * Use for city codes and slugs; also the sitewide footer city link strip (sort + label).
 * Do not use for general CMS display or tour titles unless product asks for it.
 *
 * @example
 * stripAccents("Córdoba") // "Cordoba"
 * stripAccents("Zürich")  // "Zurich"
 * stripAccents("Montréal") // "Montreal"
 */
export function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/\p{Mark}/gu, "");
}

/**
 * URL-safe slug for city/tour path segments (slashes → dashes, accents
 * stripped, ASCII + hyphens only).
 */
export function slugifyForUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  const noAccents = stripAccents(trimmed);
  const withDashes = noAccents
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const lower = withDashes.toLowerCase();
  const slugSafe = lower.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return slugSafe.replace(/^-|-$/g, "") || "unknown";
}
