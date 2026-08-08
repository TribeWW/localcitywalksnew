/**
 * Next.js metadata for the explore catalog page.
 */

import type { Metadata } from "next";
import { EXPLORE_PAGE_URL } from "@/lib/structured-data/explore";
import { absoluteUrl } from "@/lib/site";

/** Explore page `<title>` and Open Graph title. */
export const EXPLORE_PAGE_TITLE = "Explore tours - LocalCityWalks";

/** Explore page meta description. */
export const EXPLORE_PAGE_DESCRIPTION =
  "Browse all city walking tours. Filter by country and sort alphabetically.";

const EXPLORE_OG_IMAGE_URL = absoluteUrl("/guide.png");

/**
 * Builds Next.js metadata for `/explore` including canonical, Open Graph, and Twitter tags.
 */
export function buildExplorePageMetadata(): Metadata {
  return {
    title: EXPLORE_PAGE_TITLE,
    description: EXPLORE_PAGE_DESCRIPTION,
    alternates: {
      canonical: EXPLORE_PAGE_URL,
    },
    openGraph: {
      title: EXPLORE_PAGE_TITLE,
      description: EXPLORE_PAGE_DESCRIPTION,
      url: EXPLORE_PAGE_URL,
      type: "website",
      siteName: "LocalCityWalks",
      images: [
        {
          url: EXPLORE_OG_IMAGE_URL,
          alt: EXPLORE_PAGE_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: EXPLORE_PAGE_TITLE,
      description: EXPLORE_PAGE_DESCRIPTION,
      images: [EXPLORE_OG_IMAGE_URL],
    },
  };
}
