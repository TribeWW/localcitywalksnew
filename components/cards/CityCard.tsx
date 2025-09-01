import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface CityCardProps {
  cityName: string;
  imageUrl: string;
  imageAlt: string;
}

const CityCard = ({ cityName, imageUrl, imageAlt }: CityCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden w-[250px]">
      <div className="relative h-48 w-full">
        <Image src={imageUrl} alt={imageAlt} fill className="object-cover" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-nightsky mb-4">{cityName}</h3>
        <Button className="w-full">Request this tour</Button>
      </div>
    </div>
  );
};

export default CityCard;
