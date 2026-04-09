import type { SanityReviewListItem } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

export type ReviewsSectionVariant = "home" | "tour" | "fallback";

type ReviewsSectionProps = {
  title: string;
  reviews: SanityReviewListItem[];
  variant?: ReviewsSectionVariant;
};

function meanStarRating(reviews: SanityReviewListItem[]): number {
  if (reviews.length === 0) return 0;
  let sum = 0;
  for (const r of reviews) {
    const n = Math.round(Number(r.rating));
    const s = !Number.isFinite(n) ? 0 : Math.min(5, Math.max(0, n));
    sum += s;
  }
  return sum / reviews.length;
}

export function ReviewsSection({
  title,
  reviews,
  variant = "tour",
}: ReviewsSectionProps) {
  if (reviews.length === 0) return null;

  const isHome = variant === "home";
  const cardPresentation = isHome ? "home" : "default";
  const avg = meanStarRating(reviews);

  if (isHome) {
    return (
      <section
        className="w-full bg-white px-6 py-16"
        aria-labelledby="reviews-section-title"
      >
        <div className="mx-auto max-w-[1140px]">
          <div className="mb-12 text-center">
            <h2
              id="reviews-section-title"
              className="mb-3 text-[32px] font-bold leading-[1.3] text-[#0F172A]"
            >
              {title}
            </h2>
            <p className="text-lg leading-relaxed text-[#6A6A6A]">
              ⭐ {avg.toFixed(1)} average rating from travellers across Europe
            </p>
          </div>
          <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
            {reviews.map((review) => (
              <li key={review._id}>
                <ReviewCard review={review} presentation={cardPresentation} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full bg-background py-16 md:py-20"
      aria-labelledby="reviews-section-title"
    >
      <div className="mx-auto max-w-6xl px-4 xl:px-0">
        <h2
          id="reviews-section-title"
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {title}
        </h2>

        {variant === "fallback" ? (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Recent reviews from travellers on other LocalCityWalks tours—these
            experiences were not all on this specific walk.
          </p>
        ) : null}

        <ul className="mt-10 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={review._id}>
              <ReviewCard review={review} presentation={cardPresentation} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
