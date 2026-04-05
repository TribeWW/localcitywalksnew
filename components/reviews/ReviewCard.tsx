import { Star } from "lucide-react";
import type { SanityReviewListItem } from "@/types/review";
import { formatExperienceDate } from "@/lib/utils/review-date";

/** Whole stars 0–5; invalid or out-of-range values become 0 (empty row). */
function clampRating(rating: number): number {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

export function ReviewCard({ review }: { review: SanityReviewListItem }) {
  const stars = clampRating(review.rating);
  const dateLabel = formatExperienceDate(review.experienceDate);
  const body = review.body?.trim();

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
      <div
        className="mb-4 flex gap-1 text-foreground"
        aria-label={
          stars > 0 ? `${stars} out of 5 stars` : "No star rating shown"
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="size-3.5 shrink-0"
            fill={i < stars ? "currentColor" : "none"}
            color="currentColor"
            aria-hidden
          />
        ))}
      </div>

      <p className="text-sm font-semibold text-foreground">{review.authorName}</p>

      <p className="mt-1 text-xs text-muted-foreground">
        Tour date: {dateLabel || "—"}
      </p>

      {body ? (
        <p className="mt-4 text-sm leading-relaxed text-foreground">{body}</p>
      ) : null}
    </article>
  );
}
