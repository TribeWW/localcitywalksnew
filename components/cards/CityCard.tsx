"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TourRequestForm from "@/components/forms/TourRequestForm";
import { CityCardData } from "@/types/bokun";

interface CityCardProps {
  cities: CityCardData[];
}

const CityCard = ({ cities }: CityCardProps) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleOpenModal = (cityName: string) => {
    setSelectedCity(cityName);
  };

  const handleCloseModal = () => {
    setSelectedCity(null);
  };

  return (
    <>
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
              <Button
                className="w-full bg-nightsky hover:bg-nightsky/80"
                onClick={() => handleOpenModal(city.title)}
              >
                Request private tour
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedCity} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-nightsky">
              Request tour in {selectedCity}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Contact us to plan your walking tour
            </DialogDescription>
          </DialogHeader>

          {selectedCity && (
            <TourRequestForm
              cityName={selectedCity}
              onClose={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CityCard;
