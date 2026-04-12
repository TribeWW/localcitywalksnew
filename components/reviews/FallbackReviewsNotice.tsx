"use client";

import { FallbackReviewInfoTooltip } from "./FallbackReviewInfoTooltip";

/**
 * Disclaimer shown when tour reviews are substituted with reviews from other tours;
 * info icon opens a shadcn/Radix tooltip with extra context.
 */
export function FallbackReviewsNotice() {
  return (
    <p className="mb-3 max-w-2xl text-sm leading-relaxed text-[#6A6A6A]">
      <span>
        Reviews from travellers on other LocalCityWalks tours, not this
        specific activity.{" "}
      </span>
      <FallbackReviewInfoTooltip />
    </p>
  );
}
