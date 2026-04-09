import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExploreCatalog from "@/components/explore/ExploreCatalog";
import { archivePage } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Explore tours - LocalCityWalks",
  description:
    "Browse all city walking tours. Filter by country and sort alphabetically.",
  alternates: {
    canonical: "https://www.localcitywalks.com/explore",
  },
};

/**
 * Renders the Explore page UI gated by the `archive-page` feature flag.
 *
 * @returns The React element for the Explore page. Triggers a 404 response when the `archive-page` feature is disabled.
 */
export default async function ExplorePage() {
  const enabled = await archivePage();
  if (!enabled) notFound();

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 w-full">
        <h1 className="text-3xl font-semibold text-nightsky">Explore</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Browse all walking tours. Filter by country, sort by title (A–Z or
          Z–A), and load more with the same card grid as the home page.
        </p>
        <ExploreCatalog />
      </div>
    </main>
  );
}
