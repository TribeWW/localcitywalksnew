"use client";

/**
 * Client grid for listing cards. Stays a Client Component because
 * `ExploreCatalogClient` and `ToursSectionClient` import it inside client trees.
 * Server parents enrich `CityCardData` before passing `cities` here.
 */
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { upsizeBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import { slugifyForUrl } from "@/lib/utils";
import { getCityCardDisplayContent, getCityCardImageAlt } from "@/lib/utils/city-card-display";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { CityCardData } from "@/types/bokun";

interface CityCardProps {
  cities: CityCardData[];
  /** When true, grid has no horizontal padding (py-6 only); use when parent provides px-6 for alignment with a sibling (e.g. filter button) */
  noHorizontalPadding?: boolean;
  /** Vercel Flag `cards-widget-update` — gates enriched card UI (price, ratings, Hello {city}). */
  cardsWidgetUpdate?: boolean;
}

function LegacyCityCardItem({
  href,
  image,
  imageAlt,
  title,
  subtitle,
}: {
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string | null;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={image}
            alt={imageAlt}
            fill
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-2 p-6 text-center">
          <h3 className="text-base font-semibold text-nightsky">{title}</h3>
          {subtitle ? <p className="text-sm">{subtitle}</p> : null}
        </div>
      </Link>
    </div>
  );
}

function normalizeCardImageUrl(image: string): string {
  if (image.startsWith("/")) {
    return image;
  }

  return upsizeBokunCardImageUrl(image);
}

function resolveCardPriceAmount(
  city: CityCardData,
  cardsWidgetUpdate: boolean,
): string | null {
  if (!cardsWidgetUpdate || city.displayPricePerPerson == null) {
    return null;
  }

  return formatCataloguePriceAmount(
    city.displayPricePerPerson,
    city.displayPriceCurrency?.trim() || "EUR",
  );
}

function MinimalCityCardItem({
  href,
  image,
  imageAlt,
  title,
  priceAmount,
  ratingLine,
}: {
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  priceAmount: string | null;
  ratingLine: string | null;
}) {
  return (
    <Link
      href={href}
      className="group block w-full cursor-pointer rounded-xl shadow-sm transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl md:aspect-[4/5]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          quality={90}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        {ratingLine ? (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-nightsky shadow">
            <Star
              className="size-3 fill-nightsky text-nightsky"
              aria-hidden
            />
            <span>{ratingLine}</span>
          </div>
        ) : null}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
          <h3 className="mb-2 text-lg font-semibold leading-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.3)]">
            {title}
          </h3>
          {priceAmount ? (
            <p className="text-sm text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
              From{" "}
              <span className="text-base font-bold text-white">
                {priceAmount}
              </span>{" "}
              / adult
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

const CityCard = ({
  cities,
  noHorizontalPadding,
  cardsWidgetUpdate = false,
}: CityCardProps) => {
  return (
    <div
      data-cards-widget-update={cardsWidgetUpdate ? "true" : "false"}
      className={`grid grid-cols-1 justify-items-center gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
        noHorizontalPadding ? "py-6" : "px-4 py-6 md:px-6 lg:px-0"
      }`}
    >
      {cities.map((city) => {
        const citySlug = city.citySlug ?? slugifyForUrl(city.title);
        const slugSegment = city.slug ?? city.id;
        const href = `/tours/${citySlug}/${slugSegment}`;
        const imageAlt = getCityCardImageAlt(city.title);
        const { title, ratingLine, subtitle } = getCityCardDisplayContent(
          city,
          cardsWidgetUpdate,
        );
        const priceAmount = resolveCardPriceAmount(city, cardsWidgetUpdate);

        if (cardsWidgetUpdate) {
          return (
            <MinimalCityCardItem
              key={city.id}
              href={href}
              image={normalizeCardImageUrl(city.image)}
              imageAlt={imageAlt}
              title={title}
              priceAmount={priceAmount}
              ratingLine={ratingLine}
            />
          );
        }

        return (
          <LegacyCityCardItem
            key={city.id}
            href={href}
            image={normalizeCardImageUrl(city.image)}
            imageAlt={imageAlt}
            title={title}
            subtitle={subtitle}
          />
        );
      })}
    </div>
  );
};

export default CityCard;
