import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold text-nightsky">Explore</h1>
      <p className="mt-2 text-muted-foreground">
        Browse all tours. Filtering and sorting will be added here next.
      </p>
      <div className="mt-8 rounded-lg border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Archive page skeleton (gated by the <span className="font-mono">archive-page</span>{" "}
          feature flag).
        </p>
      </div>
    </main>
  );
}

