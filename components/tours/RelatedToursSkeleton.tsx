/**
 * RelatedToursSkeleton — Suspense fallback while related tours load on the tour page.
 */

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Four card-shaped pulses in the same grid as {@link CityCard} /
 * {@link RelatedToursView}. Marked `aria-hidden` so assistive tech skips the
 * placeholder while the real section streams in.
 */
export function RelatedToursSkeleton() {
  return (
    <div
      data-testid="related-tours-skeleton"
      className="mt-16 w-full"
      aria-hidden
    >
      <Skeleton className="mb-4 h-7 w-64 max-w-full" />
      <div
        data-testid="related-tours-skeleton-grid"
        className="grid grid-cols-1 justify-items-center gap-x-6 gap-y-6 py-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            data-testid="related-tours-skeleton-card"
            className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm"
          >
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="space-y-4 p-6">
              <Skeleton className="mx-auto h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
