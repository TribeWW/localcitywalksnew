/**
 * Legacy cityCode helpers for records created before Latin letter folding
 * (ø→o, ł→l, …). Those codes dropped or dashed special letters
 * (`Tromsø` → `troms`, `Wrocław` → `wroc-aw`).
 */

/**
 * NFD combining-mark strip only (pre-fold `stripAccents` behavior).
 */
function stripCombiningMarksOnly(str: string): string {
  return str.normalize("NFD").replace(/\p{Mark}/gu, "");
}

/**
 * City slug as produced before Latin letter folding existed.
 * Use only to find and upgrade legacy Sanity `cityCode` values.
 */
export function legacyBrokenCitySlug(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  const noAccents = stripCombiningMarksOnly(trimmed);
  const withDashes = noAccents
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const lower = withDashes.toLowerCase();
  const slugSafe = lower.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return slugSafe.replace(/^-|-$/g, "") || "unknown";
}

/**
 * Canonical cityCode plus any pre-fold slug derived from the display name.
 * Lookup should try these before creating a new city document.
 */
export function cityCodeLookupCandidates(
  canonicalCityCode: string,
  cityName: string,
): string[] {
  const canonical = canonicalCityCode.trim().toLowerCase();
  const legacy = legacyBrokenCitySlug(cityName);
  const codes = new Set<string>();
  if (canonical && canonical !== "unknown") codes.add(canonical);
  if (legacy && legacy !== "unknown") codes.add(legacy);
  return [...codes];
}
