import { ReviewCard, type ReviewCardProps } from "./ReviewCard";

export interface ReviewMarqueeProps {
  title: string;
  row1: ReviewCardProps[];
  row2: ReviewCardProps[];
}

/**
 * Mockup-only: dual-row infinite marquee for design preview (`/preview/reviews-mockup`).
 */
export function ReviewMarquee({ title, row1, row2 }: ReviewMarqueeProps) {
  return (
    <section className="w-full overflow-hidden bg-white py-16">
      <style>
        {`
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left {
            animation: marquee-left 40s linear infinite;
          }
          .animate-marquee-right {
            animation: marquee-right 40s linear infinite;
          }
          .pause-on-hover:hover {
            animation-play-state: paused;
          }
          .marquee-track {
            display: flex;
            width: max-content;
          }
          .marquee-content {
            display: flex;
            gap: 24px;
            padding-right: 24px;
          }
          .marquee-card-wrapper {
            width: 320px;
            flex-shrink: 0;
          }
        `}
      </style>

      <div className="mx-auto mb-12 max-w-[1280px] px-4 text-center md:px-6">
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#0F172A",
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
          }}
        >
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <div className="marquee-track animate-marquee-left pause-on-hover">
          <div className="marquee-content">
            {row1.map((review, i) => (
              <div key={`r1-a-${i}`} className="marquee-card-wrapper">
                <ReviewCard {...review} maxLines={3} />
              </div>
            ))}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {row1.map((review, i) => (
              <div key={`r1-b-${i}`} className="marquee-card-wrapper">
                <ReviewCard {...review} maxLines={3} />
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-track animate-marquee-right pause-on-hover">
          <div className="marquee-content">
            {row2.map((review, i) => (
              <div key={`r2-a-${i}`} className="marquee-card-wrapper">
                <ReviewCard {...review} maxLines={3} />
              </div>
            ))}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {row2.map((review, i) => (
              <div key={`r2-b-${i}`} className="marquee-card-wrapper">
                <ReviewCard {...review} maxLines={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
