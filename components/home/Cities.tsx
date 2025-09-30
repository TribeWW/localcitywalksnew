import React from "react";
import CityCard from "@/components/cards/CityCard";
import { getAllProducts } from "@/lib/actions/tour.actions";
import { CityCardData } from "@/types/bokun";

// Fallback cities data in case API fails
const FALLBACK_CITIES: CityCardData[] = [
  {
    id: "fallback-1",
    title: "Aix-en-Provence",
    image:
      "https://images.unsplash.com/photo-1702506183913-4984987e5bf0?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-2",
    title: "Albufeira",
    image:
      "https://images.unsplash.com/photo-1605385257286-424abb08013b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-3",
    title: "Arles",
    image:
      "https://images.unsplash.com/photo-1616421503202-f14b55e25694?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-4",
    title: "Avignon",
    image:
      "https://images.unsplash.com/photo-1570008439944-903108707396?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-5",
    title: "Biarritz",
    image:
      "https://images.unsplash.com/photo-1603061624410-810aa248dd19?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-6",
    title: "Bilbao",
    image:
      "https://images.unsplash.com/photo-1544041510-c6127fc6853d?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-7",
    title: "Cádiz",
    image:
      "https://images.unsplash.com/photo-1626037552355-9c9efef3b2ae?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-8",
    title: "Carcassonne",
    image:
      "https://images.unsplash.com/photo-1580513860129-dee8825dfe44?q=80&w=1029&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-9",
    title: "Coimbra",
    image:
      "https://images.unsplash.com/photo-1672995259409-f749336b646b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-10",
    title: "Faro",
    image:
      "https://images.unsplash.com/photo-1656937970151-ee7350ca10d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-11",
    title: "Funchal",
    image:
      "https://images.unsplash.com/photo-1620455397193-1de548320817?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-12",
    title: "Girona",
    image:
      "https://images.unsplash.com/photo-1515974448560-3e45c9d51f95?q=80&w=1138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-13",
    title: "Lagos",
    image:
      "https://images.unsplash.com/photo-1602148715106-e4d088175c9f?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-14",
    title: "Lourdes",
    image:
      "https://images.unsplash.com/photo-1641070496002-8077aefba51c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-15",
    title: "Marseille",
    image:
      "https://images.unsplash.com/photo-1566838217578-1903568a76d9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-16",
    title: "Salamanca",
    image:
      "https://images.unsplash.com/photo-1616854611267-0257c5526de2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-17",
    title: "San Sebastian",
    image:
      "https://images.unsplash.com/photo-1594305548608-df04461f1b28?q=80&w=1612&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-18",
    title: "Santiago de Compostella",
    image:
      "https://images.unsplash.com/photo-1662917625298-50b4d1520b11?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "fallback-19",
    title: "Toledo",
    image:
      "https://plus.unsplash.com/premium_photo-1697730183194-fcc955ed153b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const Cities = async () => {
  // Fetch cities data from Bokun API
  const result = await getAllProducts();
  const cities = result.success && result.data ? result.data : FALLBACK_CITIES;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-semibold text-white mb-4">
          Explore cities
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Discover hidden gems with trusted local guides
        </p>
        <CityCard cities={cities} />
      </div>
    </section>
  );
};

export default Cities;
