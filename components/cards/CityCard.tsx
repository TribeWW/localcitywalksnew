"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { stripAccents } from "@/lib/utils";
import { CityCardData } from "@/types/bokun";

interface CityCardProps {
  cities: CityCardData[];
  /** When true, grid has no horizontal padding (py-6 only); use when parent provides px-6 for alignment with a sibling (e.g. filter button) */
  noHorizontalPadding?: boolean;
}

function slugifyForUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  const noAccents = stripAccents(trimmed);
  const withDashes = noAccents
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const lower = withDashes.toLowerCase();
  const slugSafe = lower.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return slugSafe.replace(/^-|-$/g, "") || "unknown";
}

const CityCard = ({ cities, noHorizontalPadding }: CityCardProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center ${
        noHorizontalPadding ? "py-6" : "p-6"
      }`}
    >
      {cities.map((city) => {
        const citySlug = city.citySlug ?? slugifyForUrl(city.title);
        const slugSegment = city.slug ?? city.id;
        const href = `/tours/${citySlug}/${slugSegment}`;
        return (
          <div
            key={city.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-[250px] transition-all duration-200 hover:shadow-lg hover:scale-105"
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
                <h3 className="text-base font-semibold text-nightsky mb-1">
                  {city.title}
                </h3>
                <p className="text-sm mb-2 text-muted-foreground">
                  Private tour
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default CityCard;
