import type { Metadata } from "next";
import Image from "next/image";
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
 * Render the Explore page when the `archive-page` feature is enabled.
 *
 * @returns The React element for the Explore page. If the `archive-page` feature is disabled, triggers a 404 response.
 */
export default async function ExplorePage() {
  const enabled = await archivePage();
  if (!enabled) notFound();

  return (
    <main className="bg-white">
      <div className="bg-[#F7F7F7]">
        <div className="mx-auto w-full max-w-[1140px] px-6 pb-6 pt-8">
          <h1 className="mb-2 text-[32px] font-bold leading-[1.3] text-[#0F172A]">
            👋 Hello Walks
          </h1>
          <p className="max-w-[640px] text-[18px] leading-[1.6] text-[#6A6A6A]">
            Local-led private walking tours that blend iconic landmarks, hidden
            corners, and personal stories — bringing the city to life.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Image
              src="/localguides-avatars.png"
              alt="Local guides avatars"
              width={304}
              height={80}
              className="h-10 w-auto"
            />
            <span className="text-sm font-medium text-[#6A6A6A]">
              40+ local guides across Europe
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <ExploreCatalog />
      </div>
    </main>
  );
}
