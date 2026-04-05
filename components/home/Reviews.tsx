import { getRecentReviews } from "@/lib/actions/reviews.actions";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

/**
 * Home page reviews block: fetches global recent reviews from Sanity.
 * Renders nothing when the list is empty or fetch fails (handled in actions).
 * Page wiring and feature flag live in Phase 3.
 */
export default async function Reviews() {
  const reviews = await getRecentReviews();
  if (reviews.length === 0) return null;

  return (
    <ReviewsSection title="What travellers say" reviews={reviews} variant="tour" />
  );
}
