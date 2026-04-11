import {
  getAllReviewRatings,
  getRecentReviews,
} from "@/lib/actions/reviews.actions";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

const HOME_RECENT_REVIEW_LIMIT = 12;

/**
 * Render the home page reviews block using recent global reviews.
 *
 * Fetches up to HOME_RECENT_REVIEW_LIMIT recent reviews and site-wide rating
 * summary; renders ReviewsSection or `null` when no reviews are available.
 */
export default async function Reviews() {
  const [reviews, allRatings] = await Promise.all([
    getRecentReviews(HOME_RECENT_REVIEW_LIMIT),
    getAllReviewRatings(),
  ]);
  if (reviews.length === 0) return null;

  const summary =
    allRatings != null && allRatings.totalCount > 0 ? allRatings : null;

  return (
    <ReviewsSection
      title="Loved by travellers"
      reviews={reviews}
      summary={summary}
      variant="home"
    />
  );
}
