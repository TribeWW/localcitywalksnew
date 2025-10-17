import React from "react";
import Image from "next/image";

interface StepCardProps {
  stepNumber: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  description?: string;
}

const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  icon,
  image,
  description,
}) => {
  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      {/* Background Image */}
      <Image
        src={image}
        alt={`${title} illustration`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Step Icon */}
      <div className="absolute top-4 left-4">
        <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
          {React.createElement(icon, {
            className: "w-6 h-6 text-tangerine",
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <p className="text-sm font-medium text-white mb-1">Step {stepNumber}</p>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        {description && <p className="text-sm text-white/90">{description}</p>}
      </div>
    </div>
  );
};

export default StepCard;
