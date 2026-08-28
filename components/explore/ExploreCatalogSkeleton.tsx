import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for `/explore` while the catalog Suspense boundary resolves.
 *
 * Sticky bar mirrors picker + optional quick filters (no Sort on mobile).
 * Catalog meta row mirrors count → chips stubs → Sort on the right (desktop only).
 *
 * @returns Skeleton filter bar, meta row, and an 8-card catalog grid
 */
export default function ExploreCatalogSkeleton() {
  return (
    <>
      <div
        className="sticky top-0 z-30 w-full border-b border-border bg-white"
        data-testid="explore-catalog-skeleton-filters"
        aria-hidden
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-2 lg:flex-nowrap lg:gap-4 lg:px-0">
          <Skeleton
            data-testid="explore-catalog-skeleton-picker"
            className="h-10 w-full rounded-sm lg:w-[200px] lg:flex-none"
          />
          <div
            className="hidden h-6 w-px shrink-0 bg-border lg:block"
            aria-hidden
          />
          <div
            data-testid="explore-catalog-skeleton-quick-filters"
            className="hidden min-w-0 items-center gap-2 lg:flex"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      <section className="py-6" aria-hidden>
        <div className="mx-auto max-w-6xl px-6 md:px-8 lg:px-0">
          <div
            data-testid="explore-catalog-skeleton-meta"
            className="flex flex-wrap items-center gap-x-4 gap-y-3"
          >
            <Skeleton
              data-testid="explore-catalog-skeleton-count"
              className="order-2 h-5 w-28 rounded-sm lg:order-1"
            />
            <div
              data-testid="explore-catalog-skeleton-chips"
              className="order-1 flex items-center gap-2 lg:order-2"
            >
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <Skeleton
              data-testid="explore-catalog-skeleton-sort"
              className="order-3 ml-auto hidden h-10 w-[170px] rounded-md lg:block"
            />
          </div>
          <div
            data-testid="explore-catalog-skeleton-grid"
            className="grid grid-cols-1 justify-items-center gap-6 py-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm"
              >
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="space-y-4 p-6">
                  <Skeleton className="mx-auto h-6 w-3/4" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
