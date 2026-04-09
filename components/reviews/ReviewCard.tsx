import { Star } from "lucide-react";
import type { SanityReviewListItem } from "@/types/review";
import { cn } from "@/lib/utils";
import { formatExperienceDate } from "@/lib/utils/review-date";

/**
 * Normalize a numeric rating to a whole number between 0 and 5.
 *
 * Rounds the input to the nearest integer and clamps the result to the 0–5 range.
 *
 * @returns An integer between 0 and 5 inclusive. Returns `0` for non-finite inputs.
 */
function clampRating(rating: number): number {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

export type ReviewCardPresentation = "default" | "home";

type ReviewCardProps = {
  review: SanityReviewListItem;
  /** `home` matches the /preview/reviews-mockup grid card styling. */
  presentation?: ReviewCardPresentation;
};

/**
 * Render a review card showing a star rating, author name, tour date, and optional body text.
 *
 * The `presentation` prop controls visual styling and spacing; `"home"` applies alternate colors,
 * spacing, and a simplified date line.
 *
 * @param review - Review data used to populate the card (expected fields: `authorName`, `rating`, `experienceDate`, and optional `body`)
 * @param presentation - Visual variant of the card; `"default"` (default) or `"home"`
 * @returns A JSX element representing the formatted review card
 */
export function ReviewCard({
  review,
  presentation = "default",
}: ReviewCardProps) {
  const stars = clampRating(review.rating);
  const dateLabel = formatExperienceDate(review.experienceDate);
  const body = review.body?.trim();
  const isHome = presentation === "home";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg p-6",
        isHome
          ? "border-[1.5px] border-[#D3CED2] bg-white"
          : "border border-border bg-card",
      )}
    >
      <div
        className={cn("mb-4 flex gap-1", isHome ? "" : "text-foreground")}
        aria-label={
          stars > 0 ? `${stars} out of 5 stars` : "No star rating shown"
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="size-[14px] shrink-0"
            fill={
              i < stars
                ? isHome
                  ? "#0F172A"
                  : "currentColor"
                : "none"
            }
            color={i < stars ? (isHome ? "#0F172A" : "currentColor") : isHome ? "#D3CED2" : "currentColor"}
            aria-hidden
          />
        ))}
      </div>

      <p
        className={cn(
          "text-sm font-semibold",
          isHome ? "mb-1 text-[#0F172A]" : "text-foreground",
        )}
      >
        {review.authorName}
      </p>

      <p
        className={cn(
          "text-xs",
          isHome ? "mb-4 text-[#6A6A6A]" : "mt-1 text-muted-foreground",
        )}
      >
        {isHome ? dateLabel || "—" : `Tour date: ${dateLabel || "—"}`}
      </p>

      {body ? (
        <p
          className={cn(
            "text-sm leading-relaxed",
            isHome
              ? "mt-0 flex-1 text-[#1A1A1A] leading-[1.6]"
              : "mt-4 text-foreground",
          )}
        >
          {body}
        </p>
      ) : null}
    </article>
  );
}
