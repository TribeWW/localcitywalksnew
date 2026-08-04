import { Skeleton } from "@/components/ui/skeleton";
import ExploreCatalogSkeleton from "@/components/explore/ExploreCatalogSkeleton";

/**
 * Route-level loading UI for /explore. Hero placeholders plus the shared catalog skeleton.
 */
export default function Loading() {
  return (
    <main className="bg-white">
      <div className="bg-[#F7F7F7]">
        <div className="mx-auto w-full max-w-[1140px] px-6 pb-6 pt-8 lg:px-0">
          <Skeleton className="mb-2 h-10 w-56" />
          <Skeleton className="mt-3 h-5 max-w-[640px]" />
          <Skeleton className="mt-2 h-5 max-w-[480px]" />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      </div>
      <ExploreCatalogSkeleton />
    </main>
  );
}
