/**
 * Format a review author for public display (GDPR): given name(s) plus the first
 * letter of the family name with a full stop (e.g. `"Jane Doe"` → `"Jane D."`).
 */
export function formatPublicReviewAuthorName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "—";

  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return parts[0]!;
  }

  const first = parts[0]!;
  const lastWord = parts[parts.length - 1]!;
  const ch = lastWord.charAt(0);
  if (!ch) {
    return first;
  }

  const initial = ch.toLocaleUpperCase();
  return `${first} ${initial}.`;
}
