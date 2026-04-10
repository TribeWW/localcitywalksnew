"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { SanityReviewListItem } from "@/types/review";
import { ReviewCard, type ReviewCardPresentation } from "./ReviewCard";

const INITIAL_VISIBLE = 3;
const LOAD_MORE_STEP = 2;

type TourReviewsExpandableListProps = {
  reviews: SanityReviewListItem[];
  presentation: Extract<ReviewCardPresentation, "tourDetail">;
};

/**
 * Tour detail: show the first {@link INITIAL_VISIBLE} reviews, then load
 * {@link LOAD_MORE_STEP} more per click until the server-provided list is exhausted.
 */
export function TourReviewsExpandableList({
  reviews,
  presentation,
}: TourReviewsExpandableListProps) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_VISIBLE, reviews.length),
  );
  const scrollToReviewIdRef = useRef<string | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE, reviews.length));
    scrollToReviewIdRef.current = null;
  }, [reviews]);

  const visible = reviews.slice(0, visibleCount);
  const showReadMore = visibleCount < reviews.length;

  const handleReadMore = useCallback(() => {
    const firstNewId = reviews[visibleCount]?._id ?? null;
    scrollToReviewIdRef.current = firstNewId;
    setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, reviews.length));
  }, [reviews, visibleCount]);

  useLayoutEffect(() => {
    const id = scrollToReviewIdRef.current;
    scrollToReviewIdRef.current = null;
    if (!id) return;
    const el = document.querySelector(`[data-tour-review-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  return (
    <div className="flex min-w-0 flex-col">
      <ul
        id="tour-review-cards"
        className="flex list-none flex-col gap-4 p-0"
      >
        {visible.map((review) => (
          <li key={review._id} data-tour-review-id={review._id}>
            <ReviewCard review={review} presentation={presentation} />
          </li>
        ))}
      </ul>

      {showReadMore ? (
        <div className="mt-8 text-center">
          <button
            type="button"
            className="text-sm font-semibold text-[#0F172A] underline decoration-1 underline-offset-[3px]"
            aria-expanded={false}
            aria-controls="tour-review-cards"
            onClick={handleReadMore}
          >
            Read more reviews
          </button>
        </div>
      ) : null}
    </div>
  );
}
