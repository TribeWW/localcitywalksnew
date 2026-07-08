import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { transformSearchProductToCityCard } from "@/lib/bokun/transform-search-product-to-city-card";
import { normalizeBokunProductIds } from "@/lib/utils/bokun-product-id";
import { client } from "@/sanity/lib/client";
import type { CityCardData } from "@/types/bokun";

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

const SPOTLIGHT_QUERY = `*[_type == "homeSpotlight" && ${DRAFT_EXCLUDED}][0]{
  "items": coalesce(items, [])[]{ "id": bokunProductId }
}`;

type SpotlightDoc = {
  items?: Array<{ id?: string | number | null }> | null;
} | null;

const MAX_ITEMS = 8;

/**
 * Bókun test-channel product ids for the spotlight in preview/local, where the
 * production ids stored in Sanity don't exist on `bokuntest.com`. Keep in editorial
 * order; extend up to {@link MAX_ITEMS} entries.
 */
const PREVIEW_SPOTLIGHT_IDS = [
  "15683",
  "15684",
  "15685",
  "15686",
  "15687",
  "15688",
  "15689",
];

/**
 * Preview and local instances query `bokuntest.com`, whose catalog uses different
 * product ids than production. In those environments show the curated test ids
 * instead of the Sanity (production) ids so the section renders.
 */
function shouldUsePreviewSpotlightIds(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

/**
 * Loads spotlight Bokun ids: the curated test list in preview/local, otherwise the
 * published `homeSpotlight` doc from Sanity (no drafts). Returns `null` on Sanity failure.
 */
async function getSpotlightProductIds(): Promise<string[] | null> {
  if (shouldUsePreviewSpotlightIds()) {
    return normalizeBokunProductIds(PREVIEW_SPOTLIGHT_IDS, MAX_ITEMS);
  }

  let doc: SpotlightDoc;
  try {
    doc = await client.fetch<SpotlightDoc>(SPOTLIGHT_QUERY);
  } catch (e) {
    console.error("[Home spotlight] Sanity fetch failed", e);
    return null;
  }

  return normalizeBokunProductIds(
    doc?.items?.map((row) => row.id) ?? [],
    MAX_ITEMS,
  );
}

/**
 * Loads spotlight ids (Sanity in production, curated test ids in preview/local), resolves
 * each Bokun id via `getTourDetailById`, maps to `CityCardData` in editorial order, skips
 * failures. Safe for Server Components (plain module, not `"use server"`).
 */
export async function getHomeSpotlightCityCards(): Promise<CityCardData[]> {
  const ids = await getSpotlightProductIds();

  if (!ids || ids.length === 0) {
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
        res.success ? "" : (res.error ?? ""),
      );
    }
  }

  return cards;
}
