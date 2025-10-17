import React from "react";
import StepCard from "./StepCard";
import { MapPin, Users, Coffee, Camera } from "lucide-react";

interface StepData {
  stepNumber: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  description?: string;
}

const STEPS_DATA: StepData[] = [
  {
    stepNumber: 1,
    title: "Choose Your City",
    icon: MapPin,
    image: "/step-1-city-image.jpg",
    description: "Select from our curated list of European cities",
  },
  {
    stepNumber: 2,
    title: "Meet Your Guide",
    icon: Users,
    image: "/step-2-guide-image.jpg",
    description: "Connect with a trusted local guide",
  },
  {
    stepNumber: 3,
    title: "Experience Local Life",
    icon: Coffee,
    image: "/step-3-experience-image.jpg",
    description: "Discover hidden gems and authentic experiences",
  },
  {
    stepNumber: 4,
    title: "Create Memories",
    icon: Camera,
    image: "/step-4-memories-image.jpg",
    description: "Make lasting memories with your group",
  },
];

const StepsSection: React.FC = () => {
  return (
    <div className="w-full max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {STEPS_DATA.map((step) => (
          <StepCard
            key={step.stepNumber}
            stepNumber={step.stepNumber}
            title={step.title}
            icon={step.icon}
            image={step.image}
            description={step.description}
          />
        ))}
      </div>
    </div>
  );
};

export default StepsSection;
