/**
 * Coerces a Bókun product id to a digits-only string (API payloads may use numbers).
 */
export function toBokunProductIdDigits(rawId: unknown): string | null {
  if (rawId == null) {
    return null;
  }

  const asString = typeof rawId === "string" ? rawId : String(rawId);
  const digits = asString.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  return digits;
}

/**
 * Dedupes, normalizes, and caps a list of Bókun product ids for server-side enrichment.
 */
export function normalizeBokunProductIds(
  productIds: readonly unknown[],
  maxIds: number,
): string[] {
  if (maxIds <= 0) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawId of productIds) {
    const digits = toBokunProductIdDigits(rawId);
    if (!digits || seen.has(digits)) {
      continue;
    }

    seen.add(digits);
    normalized.push(digits);
    if (normalized.length >= maxIds) {
      break;
    }
  }

  return normalized;
}
