import { getExploreCatalogPage } from "@/lib/explore-catalog";
import ExploreCatalogClient from "@/components/explore/ExploreCatalogClient";

export default async function ExploreCatalog() {
  const result = await getExploreCatalogPage(1, undefined, true);

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
        <p className="font-medium text-destructive">
          We couldn&apos;t load the tour catalog.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.error ?? "Please try again in a few minutes."}
        </p>
      </div>
    );
  }

  const initialData = result.data ?? [];
  const totalHits = result.totalHits ?? initialData.length;

  return (
    <ExploreCatalogClient
      initialData={initialData}
      totalHits={totalHits}
      initialSortAscending
    />
  );
}
