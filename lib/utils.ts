import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Letters that stay whole under NFD (no combining mark to strip).
 * Map each to the closest plain Latin form before accent stripping.
 * Covers Nordic, Polish, German, and Icelandic city names used in URLs.
 *
 * City sync must still find Sanity docs stored under the pre-fold codes
 * (e.g. troms, wroc-aw); see `lib/cities/legacy-city-code.ts`.
 */
const LATIN_LETTER_FOLDS: Record<string, string> = {
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  æ: "ae",
  Æ: "Ae",
  œ: "oe",
  Œ: "Oe",
  ß: "ss",
  ẞ: "SS",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "Th",
  đ: "d",
  Đ: "D",
};

const LATIN_LETTER_FOLD_PATTERN = new RegExp(
  `[${Object.keys(LATIN_LETTER_FOLDS).join("")}]`,
  "g",
);

function foldLatinLetters(str: string): string {
  return str.replace(
    LATIN_LETTER_FOLD_PATTERN,
    (ch) => LATIN_LETTER_FOLDS[ch] ?? ch,
  );
}

/**
 * Removes diacritical marks (accents) from a string, and folds letters that
 * do not decompose under NFD (ø, ł, æ, ß, …) into plain Latin forms.
 * Use for city codes and slugs; also the sitewide footer city link strip (sort + label).
 * Do not use for general CMS display or tour titles unless product asks for it.
 *
 * @example
 * stripAccents("Córdoba") // "Cordoba"
 * stripAccents("Zürich")  // "Zurich"
 * stripAccents("Montréal") // "Montreal"
 * stripAccents("Tromsø") // "Tromso"
 * stripAccents("Wrocław") // "Wroclaw"
 */
export function stripAccents(str: string): string {
  return foldLatinLetters(str)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "");
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
