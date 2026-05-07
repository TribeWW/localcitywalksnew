import { syncCitiesFromProducts } from "@/lib/actions/city.actions";
import { BokunProduct } from "@/types/bokun";

/**
 * Schedule a background sync of city and country data derived from the provided Bokun products.
 *
 * Triggers a fire-and-forget sync that logs summaries of created countries/cities, migrated cities, and any sync errors.
 *
 * @param items - Bokun product entries (typically from a search result page) used to derive cities and countries to sync
 */
export function scheduleSyncFromSearchItems(items: BokunProduct[]): void {
  syncCitiesFromProducts(items)
    .then((syncResult) => {
      if (syncResult.countries.created.length > 0) {
        console.log(
          "[Country Sync] Background: created",
          syncResult.countries.created.length,
          "countries:",
          syncResult.countries.created.join(", "),
        );
      }
      if (syncResult.cities.created.length > 0) {
        console.log(
          "[City Sync] Background: created",
          syncResult.cities.created.length,
          "cities:",
          syncResult.cities.created.join(", "),
        );
      }
      if (syncResult.cities.updated.length > 0) {
        console.log(
          "[City Sync] Background: migrated",
          syncResult.cities.updated.length,
          "cities:",
          syncResult.cities.updated.join(", "),
        );
      }
      const patched = syncResult.cities.tourPagePathsPatched;
      if (patched != null && patched.length > 0) {
        console.log(
          "[City Sync] Background: tourPagePath patched for",
          patched.length,
          "cities:",
          patched.join(", "),
        );
      }
      if (syncResult.errors.length > 0) {
        console.error(
          "[City Sync] Background sync had",
          syncResult.errors.length,
          "error(s):",
          syncResult.errors
            .map((e) => `${e.type}:${e.identifier} - ${e.error}`)
            .join("; "),
        );
      }
    })
    .catch((error) => {
      console.error(
        "[City Sync] Background sync failed:",
        error instanceof Error ? error.message : error,
      );
    });
}
