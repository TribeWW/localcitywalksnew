import { getExploreCatalogPage } from "@/lib/explore/catalog";
import {
  getCountryFlagIconUrls,
  mergeFlagIconsOntoCountries,
} from "@/lib/explore/country-flag-icons";
import {
  getFeaturedExploreCountries,
  intersectFeaturedWithCatalog,
} from "@/lib/explore/featured-countries";
import ExploreCatalogClient from "@/components/explore/ExploreCatalogClient";
import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import { cardsWidgetUpdate } from "@/flags";

/**
 * Render the Explore Catalog server component.
 *
 * Loads the first catalog page, featured Sanity countries, and country flag
 * icons in parallel. Featured list is intersected with the catalog country
 * list; flag URLs are merged onto catalog options by ISO2. Featured/flag fetch
 * failures fail open (handled in their loaders); catalog failure still shows
 * the error UI.
 *
 * @returns Error UI when the catalog fetch fails, otherwise `ExploreCatalogClient`
 * with initial data, sort, country list (with optional flags), and featured
 * quick-filter countries
 */
export default async function ExploreCatalog() {
  const [
    cardsWidgetUpdateEnabled,
    result,
    featuredFromSanity,
    flagIconUrls,
  ] = await Promise.all([
    cardsWidgetUpdate(),
    getExploreCatalogPage(1, undefined, true),
    getFeaturedExploreCountries(),
    getCountryFlagIconUrls(),
  ]);

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
        <p className="font-medium text-destructive">
          We couldn&apos;t load the tour catalog.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.error ?? "Please try again in a few minutes."}
        </p>
      </div>
    );
  }

  let initialData = result.data ?? [];
  if (cardsWidgetUpdateEnabled) {
    try {
      initialData = await enrichCityCardsForListing(initialData);
    } catch (e) {
      console.error("[Explore catalog] enrichment failed", e);
    }
  }
  const totalHits = result.totalHits ?? initialData.length;
  const catalogCountries = result.completeCountryList ?? [];
  const featuredCountries = intersectFeaturedWithCatalog(
    featuredFromSanity,
    catalogCountries,
  );
  const completeCountryList = mergeFlagIconsOntoCountries(
    catalogCountries,
    flagIconUrls,
  );

  return (
    <ExploreCatalogClient
      initialData={initialData}
      totalHits={totalHits}
      initialSortAscending
      completeCountryList={completeCountryList}
      featuredCountries={featuredCountries}
      cardsWidgetUpdate={cardsWidgetUpdateEnabled}
    />
  );
}
