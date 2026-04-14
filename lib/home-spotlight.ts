import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { transformSearchProductToCityCard } from "@/lib/bokun/transform-search-product-to-city-card";
import { client } from "@/sanity/lib/client";
import type { CityCardData } from "@/types/bokun";

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;
const DIGITS_ONLY_BOKUN_ID = /^\d+$/;

const SPOTLIGHT_QUERY = `*[_type == "homeSpotlight" && ${DRAFT_EXCLUDED}][0]{
  "items": coalesce(items, [])[]{ "id": bokunProductId }
}`;

type SpotlightDoc = {
  items?: Array<{ id?: string | null }> | null;
} | null;

const MAX_ITEMS = 8;

/**
 * Loads published `homeSpotlight` from Sanity (no drafts), resolves each Bokun id via
 * `getTourDetailById`, maps to `CityCardData` in editorial order, skips failures.
 * Safe for Server Components (plain module, not `"use server"`).
 */
export async function getHomeSpotlightCityCards(): Promise<CityCardData[]> {
  let doc: SpotlightDoc;
  try {
    doc = await client.fetch<SpotlightDoc>(SPOTLIGHT_QUERY);
  } catch (e) {
    console.error("[Home spotlight] Sanity fetch failed", e);
    return [];
  }

  const rawIds =
    doc?.items
      ?.map((row) => row.id?.trim())
      .filter((id): id is string => id != null && id.length > 0) ?? [];

  const ids = rawIds
    .slice(0, MAX_ITEMS)
    .filter((id) => {
      const ok = DIGITS_ONLY_BOKUN_ID.test(id);
      if (!ok) {
        console.warn("[Home spotlight] Invalid Bokun product id in Sanity:", id);
      }
      return ok;
    });
  if (ids.length === 0) {
    return [];
  }

  const details = await Promise.all(ids.map((id) => getTourDetailById(id)));

  const cards: CityCardData[] = [];
  for (let i = 0; i < details.length; i++) {
    const res = details[i];
    const id = ids[i];
    if (res.success && res.data) {
      cards.push(transformSearchProductToCityCard(res.data));
    } else {
      console.warn(
        "[Home spotlight] Skipping product",
        id,
        res.success ? "" : res.error ?? "",
      );
    }
  }

  return cards;
}
