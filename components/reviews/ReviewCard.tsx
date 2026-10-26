import Link from "next/link";
import type { HomeReviewListItem, SanityReviewListItem } from "@/types/review";
import { cn } from "@/lib/utils";
import { formatPublicReviewAuthorName } from "@/lib/reviews/review-author";
import { formatExperienceDate } from "@/lib/reviews/review-date";
import { RatingDisplay } from "./RatingDisplay";
import { ReviewBodyClamp } from "./ReviewBodyClamp";

export type ReviewCardPresentation = "default" | "home" | "tourDetail";

type ReviewCardProps =
  | {
      review: HomeReviewListItem;
      presentation: "home";
    }
  | {
      review: SanityReviewListItem;
      /** `tourDetail` matches the tour page cards. Omit it for the older shared layout. */
      presentation?: "default" | "tourDetail";
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
export function ReviewCard(props: ReviewCardProps) {
  const { review } = props;
  const presentation = props.presentation ?? "default";
  const dateLabel = formatExperienceDate(review.experienceDate);
  const body = review.body?.trim();
  const isHome = props.presentation === "home";
  const isTourDetail = presentation === "tourDetail";
  const authorDisplay = formatPublicReviewAuthorName(review.authorName);
  const branded = isHome || isTourDetail;

  const starsRow = (
    <RatingDisplay
      variant="stars"
      value={review.rating}
      className={cn("mb-4", branded ? "" : "text-foreground")}
      filledStarClassName={branded ? "text-nightsky" : undefined}
      emptyStarClassName={branded ? "text-border" : undefined}
    />
  );

  if (props.presentation === "home") {
    const homeReview = props.review;
    return (
      <article className="flex w-full shrink-0 flex-col rounded-lg border-[1.5px] border-border bg-white p-6">
        {starsRow}
        {body ? (
          <ReviewBodyClamp text={body} maxLines={4} className="mb-4" />
        ) : null}
        <p className="mb-1 text-sm font-semibold text-nightsky">
          {authorDisplay}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <Link
            href={homeReview.cityHref}
            className="  decoration-1 muted-foreground hover:underline underline-offset-[3px] hover:opacity-90 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nightsky focus-visible:ring-offset-2"
          >
            {homeReview.cityName}, {homeReview.countryName}
          </Link>
          {dateLabel ? (
            <>
              <span aria-hidden="true"> · </span>
              <time dateTime={review.experienceDate}>{dateLabel}</time>
            </>
          ) : null}
        </p>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "flex h-full min-h-0 w-full flex-col rounded-lg p-6",
        isTourDetail
          ? "border-[1.5px] border-border bg-white"
          : "border border-border bg-card",
      )}
    >
      {starsRow}
      <p
        className={cn(
          "mb-1 text-sm font-semibold",
          isTourDetail ? "text-[#0F172A]" : "text-foreground",
        )}
      >
        {authorDisplay}
      </p>
      <p
        className={cn(
          "text-xs text-muted-foreground",
          isTourDetail ? "mb-4" : "mt-1",
        )}
      >
        {isTourDetail ? dateLabel || "—" : `Tour date: ${dateLabel || "—"}`}
      </p>
      {body ? (
        <p
          className={cn(
            "text-sm leading-relaxed",
            isTourDetail
              ? "mt-0 flex-1 text-foreground leading-[1.6]"
              : "mt-4 text-foreground",
          )}
        >
          {body}
        </p>
      ) : null}
    </article>
  );
}
