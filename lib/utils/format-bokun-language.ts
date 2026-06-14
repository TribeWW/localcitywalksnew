/**
 * Display labels for Bókun guided-language codes (LOC-1051 / LOC-1042).
 *
 * Used by `LanguageSelector` and booking widget copy. Unknown codes fall back to
 * underscore-stripped uppercase (e.g. `EN_GB` → “English”).
 */

/** Human-readable labels for common Bókun language codes. */
const BOKUN_LANGUAGE_LABELS: Record<string, string> = {
  EN: "English",
  EN_GB: "English",
  EN_US: "English (US)",
  FR: "French",
  FR_FR: "French",
  ES: "Spanish",
  ES_ES: "Spanish",
  DE: "German",
  DE_DE: "German",
  IT: "Italian",
  IT_IT: "Italian",
  PT: "Portuguese",
  PT_PT: "Portuguese",
  NL: "Dutch",
  NL_NL: "Dutch",
};

/**
 * Maps a Bókun language code (e.g. `EN_GB`) to a display label for the widget.
 */
export function formatBokunLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return code;

  const upper = trimmed.toUpperCase();
  return BOKUN_LANGUAGE_LABELS[upper] ?? upper.replace(/_/g, " ");
}
