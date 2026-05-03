import { client } from "@/sanity/lib/client";
import {
  normalizeFooterCityLinkRows,
  type FooterCityLinkItem,
} from "@/lib/footer-city-link-rows";
import { stripAccents } from "@/lib/utils";

export type { FooterCityLinkItem };

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/** Ordering is applied in JS (accent-insensitive); GROQ order would mis-sort e.g. Ávila. */
const FOOTER_CITIES_QUERY = `*[_type == "city" && defined(name) && defined(tourPagePath) && ${DRAFT_EXCLUDED}] {
  "name": name,
  "href": tourPagePath
}`;

function sortAndAsciiDisplayNames(items: FooterCityLinkItem[]): FooterCityLinkItem[] {
  return [...items]
    .sort((a, b) =>
      stripAccents(a.name).localeCompare(stripAccents(b.name), "en", {
        sensitivity: "base",
      }),
    )
    .map((item) => ({
      href: item.href,
      name: stripAccents(item.name),
    }));
}

/**
 * Cities that have a `tourPagePath` set in Sanity.
 * Sorted A–Z ignoring accents; link labels use ASCII letters (footer strip only).
 */
export async function getFooterCityLinkItems(): Promise<FooterCityLinkItem[]> {
  try {
    const rows = await client.fetch<
      Array<{ name?: string | null; href?: string | null }>
    >(FOOTER_CITIES_QUERY);
    const normalized = normalizeFooterCityLinkRows(rows);
    return sortAndAsciiDisplayNames(normalized);
  } catch (e) {
    console.error("[Footer city links] Sanity fetch failed", e);
    return [];
  }
}
