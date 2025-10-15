import { Users, MapPin, Sparkles, BadgeCheck } from "lucide-react";

interface ValueProposition {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface ValuePropositionSectionProps {
  className?: string;
}

const ValueProposition = ({ className = "" }: ValuePropositionSectionProps) => {
  const valuePropositions: ValueProposition[] = [
    {
      id: "led-by-locals",
      icon: MapPin,
      title: "Led by locals",
      description:
        "Walking tours hosted by local guides who know the city best",
    },
    {
      id: "small-groups",
      icon: Users,
      title: "Small groups",
      description:
        "Intimate small group tours for a personal, flexible experience",
    },
    {
      id: "authentic-insights",
      icon: Sparkles,
      title: "Authentic insights",
      description:
        "Discover hidden cafés, local history, and authentic city life",
    },
    {
      id: "trusted-vetted",
      icon: BadgeCheck,
      title: "Trusted & vetted",
      description: "All our guides are carefully vetted local experts",
    },
  ];

  return (
    <section
      aria-labelledby="value-proposition-title"
      className={`w-full py-16 md:py-24 bg-white ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-0">
        {/* Hero Message */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="value-proposition-title"
            className="text-3xl md:text-4xl font-semibold text-nightsky mb-6"
          >
            Discover the heart of the city with a local guide
          </h2>
        </div>

        {/* Value Propositions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {valuePropositions.map((proposition) => {
            const IconComponent = proposition.icon;
            return (
              <div
                key={proposition.id}
                className="group flex flex-col items-center text-center p-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105 focus-within:outline-none focus-within:ring-2 focus-within:ring-tangerine focus-within:ring-offset-2"
                tabIndex={0}
                role="article"
                aria-labelledby={`${proposition.id}-title`}
                aria-describedby={`${proposition.id}-description`}
              >
                {/* Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-tangerine/10 flex items-center justify-center mb-4 group-hover:bg-tangerine/20 transition-colors duration-200">
                  <IconComponent
                    className="w-6 h-6 md:w-7 md:h-7 text-tangerine"
                    aria-hidden="true"
                  />
                </div>

                {/* Title */}
                <h3
                  id={`${proposition.id}-title`}
                  className="text-lg md:text-xl font-semibold text-nightsky mb-3"
                >
                  {proposition.title}
                </h3>

                {/* Description */}
                <p
                  id={`${proposition.id}-description`}
                  className="text-sm md:text-base text-nightsky leading-relaxed"
                >
                  {proposition.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
