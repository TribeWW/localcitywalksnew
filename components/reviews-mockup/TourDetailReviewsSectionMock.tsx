import { Star } from "lucide-react";
import { ReviewCard } from "./ReviewCard";

const TOTAL_REVIEWS = 30;

const DISTRIBUTION = [
  { label: "5 stars", count: 18, stars: 5 },
  { label: "4 stars", count: 8, stars: 4 },
  { label: "3 stars", count: 3, stars: 3 },
  { label: "2 stars", count: 1, stars: 2 },
  { label: "1 star", count: 0, stars: 1 },
] as const;

const SAMPLE_REVIEWS = [
  {
    name: "Sarah M.",
    location: "United Kingdom",
    date: "February 2026",
    rating: 5,
    text: "Absolutely wonderful experience! Our guide was incredibly knowledgeable and passionate about Palma. The tasting at the market was a highlight. Highly recommend for anyone visiting for the first time.",
  },
  {
    name: "James K.",
    location: "United States",
    date: "January 2026",
    rating: 5,
    text: "Perfect introduction to the city. We learned so much about the history and culture. The pace was relaxed and our guide tailored the walk to our interests. Would book again!",
  },
  {
    name: "Laura C.",
    location: "Germany",
    date: "January 2026",
    rating: 4,
    text: "Great tour with a lovely guide. We saw all the main sights plus some hidden gems. The only reason for 4 stars is that 2 hours felt a bit short — I could have kept going!",
  },
];

/**
 * Mockup-only: tour page–style reviews block (summary + distribution + vertical cards).
 * Preview: `/preview/reviews-mockup#tour-reviews`.
 */
export function TourDetailReviewsSectionMock() {
  return (
    <div
      id="tour-reviews"
      style={{
        marginTop: 64,
        marginBottom: 64,
        scrollMarginTop: 112,
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "#0F172A",
          marginBottom: 8,
          fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
        }}
      >
        Traveller reviews
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "#6A6A6A",
          marginBottom: 32,
          lineHeight: 1.6,
          fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
        }}
      >
        All reviews come from verified travellers who joined an activity with
        LocalCityWalks.
      </p>

      <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[280px_1fr] md:gap-12">
        {/* Left: Rating summary */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 24,
              fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            }}
          >
            <Star size={20} fill="#0F172A" color="#0F172A" />
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              4.5
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#6A6A6A",
              }}
            >
              based on {TOTAL_REVIEWS} reviews
            </span>
          </div>
          {DISTRIBUTION.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#6A6A6A",
                  width: 48,
                  flexShrink: 0,
                  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                }}
              >
                {row.label}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 1,
                }}
              >
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={12}
                    fill={s < row.stars ? "#0F172A" : "none"}
                    color={s < row.stars ? "#0F172A" : "#D3CED2"}
                  />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "#F7F7F7",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${TOTAL_REVIEWS ? (row.count / TOTAL_REVIEWS) * 100 : 0}%`,
                    height: "100%",
                    background: "#0F172A",
                    borderRadius: 4,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#6A6A6A",
                  width: 20,
                  textAlign: "right",
                  flexShrink: 0,
                  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                }}
              >
                {row.count}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Vertical review cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {SAMPLE_REVIEWS.map((review, i) => (
            <ReviewCard key={i} {...review} />
          ))}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 32,
        }}
      >
        <a
          href="#tour-reviews"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationThickness: 1,
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
          }}
        >
          Read more reviews
        </a>
      </div>
    </div>
  );
}
