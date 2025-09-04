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

const CITIES = [
  {
    title: "Aix-en-Provence",
    image:
      "https://images.unsplash.com/photo-1702506183913-4984987e5bf0?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Arles",
    image:
      "https://images.unsplash.com/photo-1616421503202-f14b55e25694?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Carcassonne",
    image:
      "https://images.unsplash.com/photo-1580513860129-dee8825dfe44?q=80&w=1029&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Avignon",
    image:
      "https://images.unsplash.com/photo-1570008439944-903108707396?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Lourdes",
    image:
      "https://images.unsplash.com/photo-1641070496002-8077aefba51c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Biarritz",
    image:
      "https://images.unsplash.com/photo-1603061624410-810aa248dd19?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Marseille",
    image:
      "https://images.unsplash.com/photo-1566838217578-1903568a76d9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Toledo",
    image:
      "https://plus.unsplash.com/premium_photo-1697730183194-fcc955ed153b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Cádiz",
    image:
      "https://images.unsplash.com/photo-1626037552355-9c9efef3b2ae?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Salamanca",
    image:
      "https://images.unsplash.com/photo-1616854611267-0257c5526de2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Girona",
    image:
      "https://images.unsplash.com/photo-1515974448560-3e45c9d51f95?q=80&w=1138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "San Sebastian",
    image:
      "https://images.unsplash.com/photo-1594305548608-df04461f1b28?q=80&w=1612&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Santiago de Compostella",
    image:
      "https://images.unsplash.com/photo-1662917625298-50b4d1520b11?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Bilbao",
    image:
      "https://images.unsplash.com/photo-1544041510-c6127fc6853d?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Faro",
    image:
      "https://images.unsplash.com/photo-1656937970151-ee7350ca10d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Lagos",
    image:
      "https://images.unsplash.com/photo-1602148715106-e4d088175c9f?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Coimbra",
    image:
      "https://images.unsplash.com/photo-1672995259409-f749336b646b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Funchal",
    image:
      "https://images.unsplash.com/photo-1620455397193-1de548320817?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Albufeira",
    image:
      "https://images.unsplash.com/photo-1605385257286-424abb08013b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const CityCard = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleOpenModal = (cityName: string) => {
    setSelectedCity(cityName);
  };

  const handleCloseModal = () => {
    setSelectedCity(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {CITIES.map((city, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-[250px]"
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
                className="w-full"
                onClick={() => handleOpenModal(city.title)}
              >
                Request this tour
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
