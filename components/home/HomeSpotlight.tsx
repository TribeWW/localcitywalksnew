import Link from "next/link";
import CityCard from "@/components/cards/CityCard";
import { getHomeSpotlightCityCards } from "@/lib/home-spotlight";

/**
 * Curated home tour grid from Sanity `homeSpotlight` + Bokun detail.
 * Renders nothing when zero cards resolve (no published doc or all ids failed).
 */
export default async function HomeSpotlight() {
  const cities = await getHomeSpotlightCityCards();
  if (cities.length === 0) {
    return null;
  }

  return (
    <section
      id="cities"
      className="bg-gradient-to-r from-tangerine to-grapefruit py-16 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Explore cities
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Featured tours from our collection — browse more on the full catalog.
          </p>
        </div>

        <div className="px-6">
          <CityCard cities={cities} noHorizontalPadding />
          <div className="mt-8 text-center">
            <Link
              href="/explore"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border-0 bg-nightsky px-6 py-3 font-semibold text-white transition-colors hover:bg-nightsky/90"
            >
              View all cities
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
