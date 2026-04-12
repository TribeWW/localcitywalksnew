"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const FALLBACK_REVIEWS_TOOLTIP_TEXT =
  "This activity has limited reviews. The rating reflects how travellers have rated our other experiences.";

type FallbackReviewInfoTooltipProps = {
  className?: string;
};

/**
 * Info icon + shadcn tooltip for when tour ratings draw from other experiences
 * (hero link, disclaimer paragraph, etc.).
 */
export function FallbackReviewInfoTooltip({
  className,
}: FallbackReviewInfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative top-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#6A6A6A] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] focus-visible:ring-offset-2",
              className,
            )}
            aria-label="Why these reviews are shown"
          >
            <Info className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-[min(20rem,calc(100vw-2rem))] text-balance text-left leading-snug"
        >
          {FALLBACK_REVIEWS_TOOLTIP_TEXT}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
