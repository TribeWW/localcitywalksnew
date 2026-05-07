export type FooterCityLinkItem = {
  name: string;
  href: string;
};

/**
 * Maps raw GROQ rows into footer link items (trim, drop invalid hrefs).
 * Ordering and accent-free labels are applied in `getFooterCityLinkItems`.
 */
export function normalizeFooterCityLinkRows(
  rows: Array<{ name?: string | null; href?: string | null }> | null | undefined,
): FooterCityLinkItem[] {
  if (!rows?.length) return [];
  return rows
    .map((row) => ({
      name: row.name?.trim() ?? "",
      href: row.href?.trim() ?? "",
    }))
    .filter(
      (row): row is FooterCityLinkItem =>
        row.name.length > 0 &&
        row.href.length > 0 &&
        row.href.startsWith("/tours/"),
    );
}
