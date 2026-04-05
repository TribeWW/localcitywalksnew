import type { SanityReviewListItem } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

export type ReviewsSectionVariant = "tour" | "fallback";

type ReviewsSectionProps = {
  title: string;
  reviews: SanityReviewListItem[];
  variant?: ReviewsSectionVariant;
};

export function ReviewsSection({
  title,
  reviews,
  variant = "tour",
}: ReviewsSectionProps) {
  if (reviews.length === 0) return null;

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
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
