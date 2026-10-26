import { getAllReviewRatings } from "@/lib/reviews/reviews.actions";
import { loadHomeReviews } from "@/lib/reviews/home-reviews";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

/**
 * Home page reviews. Loads enriched written reviews and the site wide rating
 * summary. Renders nothing when no card survives the filter.
 */
export default async function Reviews() {
  const [reviews, allRatings] = await Promise.all([
    loadHomeReviews(),
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
