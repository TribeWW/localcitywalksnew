import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Removes diacritical marks (accents) from a string.
 * Use for city codes and slugs only — not for display names or published content.
 *
 * @example
 * stripAccents("Córdoba") // "Cordoba"
 * stripAccents("Zürich")  // "Zurich"
 * stripAccents("Montréal") // "Montreal"
 */
export function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/\p{Mark}/gu, "");
}
