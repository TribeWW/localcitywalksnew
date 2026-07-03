import Image from "next/image";
import ExploreCatalog from "@/components/explore/ExploreCatalog";
import { ExploreJsonLd } from "@/components/seo/ExploreJsonLd";
import { getExploreCatalogForStructuredData } from "@/lib/explore-catalog";
import { buildExplorePageMetadata } from "@/lib/explore-page-metadata";
import type { ExploreCatalogJsonLdItem } from "@/lib/structured-data/explore";

export const metadata = buildExplorePageMetadata();

/**
 * Maps Bokun city card rows to explore JSON-LD list items.
 */
function toExploreJsonLdItems(
  cards: Array<{ title: string; citySlug?: string; slug?: string }>,
): ExploreCatalogJsonLdItem[] {
  return cards
    .filter((card) => card.citySlug?.trim() && card.slug?.trim())
    .map((card) => ({
      title: card.title,
      citySlug: card.citySlug!.trim(),
      slug: card.slug!.trim(),
    }));
}

/** Render the Explore page catalog with structured data for the full tour list. */
export default async function ExplorePage() {
  const catalogResult = await getExploreCatalogForStructuredData();
  const jsonLdItems = catalogResult.success
    ? toExploreJsonLdItems(catalogResult.items)
    : [];

  return (
    <main className="bg-white">
      <ExploreJsonLd items={jsonLdItems} />
      <div className="bg-[#F7F7F7]">
        <div className="mx-auto w-full max-w-[1140px] px-6 pb-6 pt-8 lg:px-0">
          <h1 className="mb-2 text-[32px] font-bold leading-[1.3] text-[#0F172A]">
            👋 Hello Walks
          </h1>
          <p className="max-w-[640px] text-[18px] leading-[1.6] text-[#6A6A6A]">
            Local-led private walking tours that blend iconic landmarks, hidden
            local corners and personal stories, bringing the city to life.
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
              70+ cities to discover across Europe
            </span>
          </div>
        </div>
      </div>

      <div className="w-full">
        <ExploreCatalog />
      </div>
    </main>
  );
}
