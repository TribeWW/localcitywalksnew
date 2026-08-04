import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder for the explore catalog grid while the server catalog resolves.
 */
export default function ExploreCatalogSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Skeleton className="h-9 w-full sm:w-[200px]" />
        <Skeleton className="h-9 w-full sm:w-40" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-full max-w-[250px] overflow-hidden rounded-xl border border-border bg-white shadow-sm"
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
  );
}
