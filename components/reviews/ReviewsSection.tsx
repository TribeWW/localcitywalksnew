import { Star } from "lucide-react";
import type { SanityReviewListItem } from "@/types/review";
import {
  meanStarRating,
  starDistribution,
  type ReviewRatingSummary,
} from "@/lib/utils/review-summary";
import { FallbackReviewsNotice } from "./FallbackReviewsNotice";
import { HomeReviewsCarousel } from "./HomeReviewsCarousel";
import { TourReviewsExpandableList } from "./TourReviewsExpandableList";

export type ReviewsSectionVariant = "home" | "tour" | "fallback";

type ReviewsSectionProps = {
  title: string;
  reviews: SanityReviewListItem[];
  /** Pre-aggregated left-column summary; when missing or empty, uses `reviews`. */
  summary?: ReviewRatingSummary | null;
  variant?: ReviewsSectionVariant;
};

/**
 * Render a reviews section using one of three layouts depending on `variant`.
 *
 * Renders nothing if `reviews` is empty. For `variant === "home"` it renders a carousel-style section; for `variant === "tour"` or `"fallback"` it renders the tour-detail layout with an average rating, a star-count distribution, and an expandable list of review cards. When a non-empty `summary` is provided it is used for the aggregated counts/average; otherwise these values are derived from `reviews`.
 *
 * @param title - Section heading text
 * @param reviews - List of reviews to display and use for computed aggregates when `summary` is not provided
 * @param summary - Optional pre-aggregated rating summary; used only when `summary.totalCount > 0`
 * @param variant - Layout variant: `"home"` | `"tour"` | `"fallback"` (defaults to `"tour"`)
 * @returns The section element for the selected layout, or `null` when there are no reviews or the variant does not match a supported layout
 */
export function ReviewsSection({
  title,
  reviews,
  summary,
  variant = "tour",
}: ReviewsSectionProps) {
  if (reviews.length === 0) return null;

  const isHome = variant === "home";
  const isTourLayout = variant === "tour" || variant === "fallback";
  const precomputed =
    summary != null && summary.totalCount > 0 ? summary : null;
  const avg = precomputed
    ? precomputed.meanDisplayStars
    : meanStarRating(reviews);

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
            <p className="flex flex-wrap items-center justify-center gap-2 text-lg leading-relaxed text-[#6A6A6A]">
              <Star
                className="size-5 shrink-0 fill-[#0F172A] text-[#0F172A]"
                aria-hidden
              />
              <span>({avg.toFixed(1)}) average rating across Europe</span>
            </p>
          </div>
          <HomeReviewsCarousel reviews={reviews} />
        </div>
      </section>
    );
  }

  if (isTourLayout) {
    const summaryTotal = precomputed ? precomputed.totalCount : reviews.length;
    const distribution = precomputed
      ? precomputed.distribution
      : starDistribution(reviews);

    return (
      <section
        id="tour-reviews"
        aria-labelledby="reviews-section-title"
        className="mb-12 w-full scroll-mt-28"
      >
        <div className="w-full pb-16">
          <h2
            id="reviews-section-title"
            className="mb-2 text-2xl font-semibold text-[#0F172A]"
          >
            {title}
          </h2>

          {variant === "fallback" ? (
            <FallbackReviewsNotice />
          ) : (
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#6A6A6A]">
              <span>
                All reviews come from verified travellers who joined this
                specific activity with LocalCityWalks.
              </span>
            </p>
          )}

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
                  {variant === "fallback"
                    ? "based on recent reviews"
                    : `based on ${summaryTotal} ${summaryTotal === 1 ? "review" : "reviews"}`}
                </span>
              </div>

              <ul className="list-none space-y-3 p-0">
                {distribution.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center gap-3 last:mb-0"
                  >
                    <span className="min-w-[4.75rem] shrink-0 text-xs text-[#6A6A6A]">
                      {row.stars === 1 ? "1 star" : `${row.stars} stars`}
                    </span>
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
