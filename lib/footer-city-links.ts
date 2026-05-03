import { client } from "@/sanity/lib/client";
import {
  normalizeFooterCityLinkRows,
  type FooterCityLinkItem,
} from "@/lib/footer-city-link-rows";

export type { FooterCityLinkItem };

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

const FOOTER_CITIES_QUERY = `*[_type == "city" && defined(name) && defined(tourPagePath) && ${DRAFT_EXCLUDED}] | order(name asc) {
  "name": name,
  "href": tourPagePath
}`;

/**
 * Cities that have a `tourPagePath` set in Sanity, ordered by name.
 * Used for the sitewide footer link strip (no Bokun fetch at render time).
 */
export async function getFooterCityLinkItems(): Promise<FooterCityLinkItem[]> {
  try {
    const rows = await client.fetch<
      Array<{ name?: string | null; href?: string | null }>
    >(FOOTER_CITIES_QUERY);
    return normalizeFooterCityLinkRows(rows);
  } catch (e) {
    console.error("[Footer city links] Sanity fetch failed", e);
    return [];
  }
}
