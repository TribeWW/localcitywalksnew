import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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
    image: "/placeholder-city.jpg",
  },
  {
    title: "Biarritz",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Marseille",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Toledo",
    image:
      "https://plus.unsplash.com/premium_photo-1697730183194-fcc955ed153b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Cádiz",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Salamanca",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Girona",
    image: "/placeholder-city.jpg",
  },
  {
    title: "San Sebastian",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Santiago de Compostella",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Bilbao",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Faro",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Lagos PT",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Coimbra",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Funchal",
    image: "/placeholder-city.jpg",
  },
  {
    title: "Albufeira",
    image: "/placeholder-city.jpg",
  },
];

const CityCard = () => {
  return (
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
            <Button className="w-full">Request this tour</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CityCard;
