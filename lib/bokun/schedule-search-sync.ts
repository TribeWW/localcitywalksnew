import { syncCitiesFromProducts } from "@/lib/actions/city.actions";
import { BokunProduct } from "@/types/bokun";

/** Fire-and-forget Sanity city/country sync from a Bokun search result page. */
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
