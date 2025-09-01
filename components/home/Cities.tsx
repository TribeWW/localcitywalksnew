import React from "react";
import CityCard from "@/components/cards/CityCard";

const Cities = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-semibold text-white mb-4">
          Explore cities
        </h2>
        <p className="text-lg text-white text-muted-foreground max-w-2xl mx-auto">
          Discover hidden gems with trusted local guides
        </p>
        <CityCard
          cityName="Avignon"
          imageUrl="https://images.unsplash.com/photo-1570008439944-903108707396?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          imageAlt="Avignon"
        />
      </div>
    </section>
  );
};

export default Cities;
