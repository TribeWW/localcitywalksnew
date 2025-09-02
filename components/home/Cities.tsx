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
        <CityCard />
      </div>
    </section>
  );
};

export default Cities;
