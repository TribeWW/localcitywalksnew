"use client";

import React from "react";
import Image from "next/image";
import { CityCardData } from "@/types/bokun";

interface CityCardProps {
  cities: CityCardData[];
}

const CityCard = ({ cities }: CityCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 justify-items-center">
      {cities.map((city) => (
        <div
          key={city.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-[250px] transition-all duration-200 hover:shadow-lg hover:scale-105"
        >
          <div className="relative h-48 w-full">
            <Image
              src={city.image}
              alt={city.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-nightsky mb-4">
              {city.title}
            </h3>
            <div className="w-full bg-nightsky/10 text-nightsky text-center py-2 px-4 rounded-md">
              Coming Soon
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CityCard;
