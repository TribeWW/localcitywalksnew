import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_STARS = 5;

/**
 * Normalize a numeric rating to a whole number between 0 and 5.
 */
export function clampStarRating(rating: number): number {
  const n = Math.round(Number(rating));
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_STARS, Math.max(0, n));
}

/**
 * Screen-reader label for an integer star row.
 */
export function formatStarRatingLabel(stars: number): string {
  return stars > 0 ? `${stars} out of 5 stars` : "No star rating shown";
}

/**
 * Screen-reader label for a numeric score badge.
 */
export function formatScoreRatingLabel(display: string): string {
  return `Rated ${display} out of 5`;
}

type RatingDisplayStarsProps = {
  variant: "stars";
  /** Raw rating; rounded and clamped to 0–5 for the star row. */
  value: number;
  className?: string;
  starClassName?: string;
  filledStarClassName?: string;
  emptyStarClassName?: string;
};

type RatingDisplayScoreProps = {
  variant: "score";
  /** Visible score text (e.g. `"4.7"`) or a number formatted to one decimal. */
  value: string | number;
  className?: string;
  starClassName?: string;
  valueClassName?: string;
  /** Trailing visible content (review count link, supporting copy). */
  children?: ReactNode;
};

export type RatingDisplayProps =
  | RatingDisplayStarsProps
  | RatingDisplayScoreProps;

/**
 * Accessible rating display for star rows and numeric score badges.
 *
 * - `stars`: five icons with `role="img"` + aria-label; icons are hidden from AT.
 * - `score`: visually hidden "Rated X out of 5"; visible number and star are aria-hidden.
 */
export function RatingDisplay(props: RatingDisplayProps) {
  if (props.variant === "stars") {
    const stars = clampStarRating(props.value);

    return (
      <div
        role="img"
        aria-label={formatStarRatingLabel(stars)}
        className={cn("flex gap-1", props.className)}
      >
        {Array.from({ length: MAX_STARS }).map((_, i) => {
          const filled = i < stars;

          return (
            <Star
              key={i}
              className={cn(
                "size-[14px] shrink-0",
                props.starClassName,
                filled ? props.filledStarClassName : props.emptyStarClassName,
              )}
              fill={filled ? "currentColor" : "none"}
              aria-hidden="true"
            />
          );
        })}
      </div>
    );
  }

  const display =
    typeof props.value === "number" ? props.value.toFixed(1) : props.value;

  return (
    <span className={cn("inline-flex items-center gap-1", props.className)}>
      <span className="sr-only">{formatScoreRatingLabel(display)}</span>
      <Star
        className={cn("size-3 shrink-0", props.starClassName)}
        aria-hidden="true"
      />
      <span className={props.valueClassName} aria-hidden="true">
        {display}
      </span>
      {props.children}
    </span>
  );
}
