import { getRecentReviews } from "@/lib/actions/reviews.actions";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

const HOME_RECENT_REVIEW_LIMIT = 6;

/**
 * Render the home page reviews block using recent global reviews.
 *
 * Fetches up to HOME_RECENT_REVIEW_LIMIT recent reviews and renders a ReviewsSection component; returns `null` when no reviews are available.
 *
 * @returns A ReviewsSection React element populated with the fetched reviews, or `null` if no reviews are available.
 */
export default async function Reviews() {
  const reviews = await getRecentReviews(HOME_RECENT_REVIEW_LIMIT);
  if (reviews.length === 0) return null;

  return (
    <ReviewsSection
      title="Loved by travellers"
      reviews={reviews}
      variant="home"
    />
  );
}
