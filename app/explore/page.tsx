import { Suspense } from "react";
import Image from "next/image";
import ExploreCatalog from "@/components/explore/ExploreCatalog";
import { ExploreJsonLdSection } from "@/components/seo/ExploreJsonLdSection";
import { buildExplorePageMetadata } from "@/lib/explore-page-metadata";

export const metadata = buildExplorePageMetadata();

/** Render the Explore page catalog; JSON-LD loads in a separate Suspense boundary. */
export default function ExplorePage() {
  return (
    <main className="bg-white">
      <Suspense fallback={null}>
        <ExploreJsonLdSection />
      </Suspense>
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
