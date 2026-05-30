import { getProductsPage } from "@/lib/actions/tour.actions";
import { enrichCityCardsForListing } from "@/lib/city-cards/enrich-city-cards-for-listing";
import { cardsWidgetUpdate } from "@/flags";
import ToursSectionClient from "@/components/home/ToursSectionClient";

/**
 * Paginated home tour grid (Bókun search page 1 + show more).
 * Enriches cards server-side when `cards-widget-update` is enabled.
 */
export default async function ToursSection() {
  const cardsWidgetUpdateEnabled = await cardsWidgetUpdate();
  const result = await getProductsPage(1);

  if (!result.success || !result.data?.length) {
    return null;
  }

  let initialData = result.data;
  if (cardsWidgetUpdateEnabled) {
    try {
      initialData = await enrichCityCardsForListing(result.data);
    } catch (e) {
      console.error("[Tours section] enrichment failed", e);
    }
  }

  return (
    <ToursSectionClient
      initialData={initialData}
      totalHits={result.totalHits ?? initialData.length}
      cardsWidgetUpdate={cardsWidgetUpdateEnabled}
    />
  );
}
