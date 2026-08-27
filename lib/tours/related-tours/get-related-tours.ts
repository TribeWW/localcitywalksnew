/**
 * get-related-tours — server orchestrator for the tour-page related section.
 *
 * Loads explore catalog snapshot, Home Spotlight ids, and Sanity region peers in
 * parallel; runs the pure selector; optionally enriches ≤4 listing cards when
 * `cardsWidgetUpdate` is on. Hard failures hide the section (`null` + log).
 */

import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import { getExploreCatalogForStructuredData } from "@/lib/explore/catalog";
import { getHomeSpotlightProductIds } from "@/lib/home/spotlight";
import { getRelatedTourRegionCities } from "@/lib/tours/related-tours/region-cities";
import { selectRelatedTours } from "@/lib/tours/related-tours/select-related-tours";
import type { CityCardData } from "@/types/bokun";

/**
 * Inputs for {@link getRelatedTours}, typically from the tour page / Suspense child.
 */
export type GetRelatedToursInput = {
  /** Current Bokun product id (excluded from results). */
  productId: string;
  /** Canonical tour-page city slug (`/tours/{citySlug}/…`). */
  citySlug: string;
  /** Bokun `googlePlace.cityCode` when present (Sanity region match key). */
  cityCode: string | null | undefined;
  /** Bokun `googlePlace.countryCode` (ISO2); blank skips geography tiers. */
  countryCode: string | null | undefined;
  /** Bokun `googlePlace.country` display name for headings. */
  countryName: string | null | undefined;
  /** When true, enrich selected cards with listing prices/ratings. */
  cardsWidgetUpdate: boolean;
};

/**
 * Successful related-tours payload for the presentational section.
 * `null` from {@link getRelatedTours} means omit the section entirely.
 */
export type GetRelatedToursResult = {
  cards: CityCardData[];
  heading: string;
};

/**
 * Loads related tour cards for a tour page.
 *
 * Flow:
 * 1. `Promise.all` — explore catalog snapshot, Home Spotlight ids (`null` → `[]`),
 *    Sanity region peers.
 * 2. Pure {@link selectRelatedTours} waterfall (city → region → country → spotlight).
 * 3. When `cardsWidgetUpdate` and there is at least one card, call
 *    {@link enrichCityCardsForListing}; enrich failure logs and keeps unenriched cards.
 *
 * Catalog snapshot failure / throw / empty selection → `null` and
 * `console.error` with prefix `[Related tours]`. Safe for Server Components
 * (plain module, not `"use server"`).
 *
 * @returns `{ cards, heading }` or `null` when the section should be hidden
 */
export async function getRelatedTours(
  input: GetRelatedToursInput,
): Promise<GetRelatedToursResult | null> {
  let catalogItems: CityCardData[];
  let spotlightIds: string[];
  let region: Awaited<ReturnType<typeof getRelatedTourRegionCities>>;

  try {
    const [catalogResult, spotlightResult, regionResult] = await Promise.all([
      getExploreCatalogForStructuredData(),
      getHomeSpotlightProductIds(),
      getRelatedTourRegionCities({
        citySlug: input.citySlug,
        cityCode: input.cityCode,
      }),
    ]);

    if (!catalogResult.success) {
      console.error(
        "[Related tours] Catalog snapshot failed",
        catalogResult.error,
      );
      return null;
    }

    catalogItems = catalogResult.items;
    spotlightIds = spotlightResult ?? [];
    region = regionResult;
  } catch (error) {
    console.error("[Related tours] Failed to load related tours inputs", error);
    return null;
  }

  let selected: ReturnType<typeof selectRelatedTours>;
  try {
    selected = selectRelatedTours({
      currentProductId: input.productId,
      citySlug: input.citySlug,
      countryCode: input.countryCode,
      hasRegion: region.hasRegion,
      regionCitySlugs: region.regionCitySlugs,
      catalog: catalogItems,
      spotlightIds,
      regionName: region.regionName,
      countryName: input.countryName,
    });
  } catch (error) {
    console.error("[Related tours] Selection failed", error);
    return null;
  }

  if (!selected || selected.cards.length === 0) {
    return null;
  }

  const cards = await maybeEnrichRelatedCards(
    selected.cards,
    input.cardsWidgetUpdate,
  );

  return {
    cards,
    heading: selected.heading,
  };
}

/**
 * Enriches related cards when the listing flag is on; on failure logs and
 * returns the unenriched cards so the section still renders.
 */
async function maybeEnrichRelatedCards(
  cards: CityCardData[],
  cardsWidgetUpdate: boolean,
): Promise<CityCardData[]> {
  if (!cardsWidgetUpdate || cards.length === 0) {
    return cards;
  }

  try {
    return await enrichCityCardsForListing(cards);
  } catch (error) {
    console.error("[Related tours] Listing enrichment failed", error);
    return cards;
  }
}
