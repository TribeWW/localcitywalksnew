"use client";

/**
 * Client grid for listing cards. Stays a Client Component because
 * `ExploreCatalogClient` and `ToursSectionClient` import it inside client trees.
 * Server parents enrich `CityCardData` before passing `cities` here.
 */
import Image from "next/image";
import Link from "next/link";
import { slugifyForUrl } from "@/lib/utils";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { CityCardData } from "@/types/bokun";

interface CityCardProps {
  cities: CityCardData[];
  /** When true, grid has no horizontal padding (py-6 only); use when parent provides px-6 for alignment with a sibling (e.g. filter button) */
  noHorizontalPadding?: boolean;
  /** Vercel Flag `cards-widget-update` — gates enriched card UI (price, ratings, Hello {city}). */
  cardsWidgetUpdate?: boolean;
}

const CityCard = ({
  cities,
  noHorizontalPadding,
  cardsWidgetUpdate = false,
}: CityCardProps) => {
  return (
    <div
      data-cards-widget-update={cardsWidgetUpdate ? "true" : "false"}
      className={`grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center ${
        noHorizontalPadding ? "py-6" : "px-4 py-6 md:px-6 lg:px-0"
      }`}
    >
      {cities.map((city) => {
        const citySlug = city.citySlug ?? slugifyForUrl(city.title);
        const slugSegment = city.slug ?? city.id;
        const href = `/tours/${citySlug}/${slugSegment}`;
        const priceLabel =
          cardsWidgetUpdate &&
          city.displayPricePerPerson != null &&
          city.displayPriceCurrency
            ? formatCataloguePriceAmount(
                city.displayPricePerPerson,
                city.displayPriceCurrency,
              )
            : null;

        return (
          <div
            key={city.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden w-full transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Link href={href} className="block">
              <div className="relative w-full aspect-[3/2]">
                <Image
                  src={city.image}
                  alt={city.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-base font-semibold text-nightsky mb-4">
                  {city.title}
                </h3>
                {cardsWidgetUpdate && priceLabel ? (
                  <p className="text-sm mb-2">{priceLabel} / person</p>
                ) : (
                  <p className="text-sm mb-2">Private tour</p>
                )}
                {cardsWidgetUpdate && city.showRating && city.ratingLabel ? (
                  <p className="text-sm text-muted-foreground">
                    ★ {city.ratingLabel}
                  </p>
                ) : null}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default CityCard;
