import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading UI for `/explore` — mirrors catalog heading + control row + card grid skeletons.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 h-5 max-w-xl" />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Skeleton className="h-9 w-full sm:w-[200px]" />
        <Skeleton className="h-9 w-full sm:w-40" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-full max-w-[250px] rounded-xl border border-border bg-white shadow-sm overflow-hidden"
          >
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

