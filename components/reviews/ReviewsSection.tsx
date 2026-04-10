import { Star } from "lucide-react";
import type { SanityReviewListItem } from "@/types/review";
import {
  meanStarRating,
  starDistribution,
  type ReviewRatingRow,
} from "@/lib/utils/review-summary";
import { ReviewCard } from "./ReviewCard";
import { TourReviewsExpandableList } from "./TourReviewsExpandableList";

export type ReviewsSectionVariant = "home" | "tour" | "fallback";

type ReviewsSectionProps = {
  title: string;
  reviews: SanityReviewListItem[];
  /** Left-column summary; when omitted, uses `reviews` (e.g. home). */
  summaryRatings?: ReadonlyArray<ReviewRatingRow>;
  variant?: ReviewsSectionVariant;
};

/**
 * Renders a reviews section. `home` uses a 3-column grid; `tour` and `fallback`
 * match the tour-detail mock layout (summary + bars + vertical cards), Tailwind-only.
 */
export function ReviewsSection({
  title,
  reviews,
  summaryRatings,
  variant = "tour",
}: ReviewsSectionProps) {
  if (reviews.length === 0) return null;

  const isHome = variant === "home";
  const isTourLayout = variant === "tour" || variant === "fallback";
  const cardPresentation = isHome ? "home" : "tourDetail";
  const summaryRows =
    summaryRatings !== undefined && summaryRatings.length > 0
      ? summaryRatings
      : reviews;
  const avg = meanStarRating(summaryRows);

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

  if (isTourLayout) {
    const summaryTotal = summaryRows.length;
    const distribution = starDistribution(summaryRows);

    return (
      <section
        id="tour-reviews"
        aria-labelledby="reviews-section-title"
        className="my-16 w-full scroll-mt-28"
      >
        <div className="w-full pb-16">
          <h2
            id="reviews-section-title"
            className="mb-2 text-2xl font-semibold text-[#0F172A]"
          >
            {title}
          </h2>

          {variant === "fallback" ? (
            <p className="mb-3 max-w-2xl text-sm leading-relaxed text-[#6A6A6A]">
              Recent reviews from travellers on other LocalCityWalks tours—these
              experiences were not all on this specific walk.
            </p>
          ) : null}

          <p className="mb-8 text-sm leading-relaxed text-[#6A6A6A]">
            All reviews come from verified travellers who joined an activity
            with LocalCityWalks. We only show the 10 most recent reviews below.
          </p>

          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <div className="mb-6 flex items-baseline gap-2 font-sans">
                <Star
                  className="size-5 shrink-0 fill-[#0F172A] text-[#0F172A]"
                  aria-hidden
                />
                <span className="text-[32px] font-bold leading-none text-[#0F172A]">
                  {avg.toFixed(1)}
                </span>
                <span className="text-sm text-[#6A6A6A]">
                  based on {summaryTotal} reviews
                </span>
              </div>

              <ul className="list-none space-y-3 p-0">
                {distribution.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center gap-3 last:mb-0"
                  >
                    <span className="w-12 shrink-0 text-xs text-[#6A6A6A]">
                      {row.label}
                    </span>
                    <div className="flex gap-px">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="size-3 shrink-0"
                          fill={s < row.stars ? "#0F172A" : "none"}
                          color={s < row.stars ? "#0F172A" : "#D3CED2"}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded bg-[#F7F7F7]">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-[#0F172A]"
                        style={{
                          width:
                            summaryTotal > 0
                              ? `${(row.count / summaryTotal) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs text-[#6A6A6A]">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <TourReviewsExpandableList
              reviews={reviews}
              presentation="tourDetail"
            />
          </div>
        </div>
      </section>
    );
  }

  return null;
}
