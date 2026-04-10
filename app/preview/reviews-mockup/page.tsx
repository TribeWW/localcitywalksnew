import type { Metadata } from "next";
import { ReviewCard } from "@/components/reviews-mockup/ReviewCard";
import { TourDetailReviewsSectionMock } from "@/components/reviews-mockup/TourDetailReviewsSectionMock";

export const metadata: Metadata = {
  title: "Reviews section mockup",
  description:
    "Temporary design preview for reviews layouts — not linked from production nav.",
  robots: { index: false, follow: false },
};

const HOME_GRID_REVIEWS = [
  {
    name: "Sarah M.",
    location: "United Kingdom",
    date: "February 2026",
    rating: 5,
    text: "Absolutely wonderful experience! Our guide was incredibly knowledgeable and passionate about Palma. The tasting at the market was a highlight.",
  },
  {
    name: "James K.",
    location: "United States",
    date: "January 2026",
    rating: 5,
    text: "Perfect introduction to the city. We learned so much about the history and culture. The pace was relaxed and our guide tailored the walk to our interests.",
  },
  {
    name: "David L.",
    location: "Australia",
    date: "February 2026",
    rating: 5,
    text: "Best walking tour I have ever been on. The stories really brought the city to life and the guide was incredibly engaging.",
  },
];

/**
 * Mock reviews page: home-style 3-col grid + tour-detail reviews block.
 */
export default function ReviewsMockupPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-border bg-pearl-gray px-4 py-3 text-center text-sm text-muted-foreground">
        Mockup only — preview at{" "}
        <span className="font-mono text-foreground">
          /preview/reviews-mockup
        </span>
      </div>

      {/* Reviews */}
      <section
        style={{
          padding: "64px 24px",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#0F172A",
                marginBottom: 12,
                lineHeight: 1.3,
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              }}
            >
              Loved by travellers
            </h2>
            <p
              style={{
                fontSize: "18px",
                color: "#6A6A6A",
                lineHeight: 1.6,
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              }}
            >
              ⭐ 4.8 average rating from travellers across Europe
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6">
            {HOME_GRID_REVIEWS.map((review, i) => (
              <ReviewCard key={i} {...review} />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <TourDetailReviewsSectionMock />
      </div>
    </main>
  );
}
