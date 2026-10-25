/**
 * Next.js metadata for the homepage. The root layout also uses the defaults
 * for routes that set no metadata of their own.
 */

import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import {
  buildPageMetadata,
  type PageSeoOverrides,
} from "@/lib/pages/page-metadata";

/** Homepage `<title>` and Open Graph title. */
export const HOME_PAGE_TITLE =
  "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks";

/** Homepage meta description. */
export const HOME_PAGE_DESCRIPTION =
  "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.";

/**
 * Builds Next.js metadata for `/` including canonical, Open Graph, and Twitter tags.
 *
 * @param overrides - Published Sanity `homePage` fields; empty fields keep the defaults
 */
export function buildHomePageMetadata(
  overrides: PageSeoOverrides | null = null,
): Metadata {
  return buildPageMetadata(
    {
      title: HOME_PAGE_TITLE,
      description: HOME_PAGE_DESCRIPTION,
      canonicalUrl: absoluteUrl("/"),
      ogImage: { url: absoluteUrl("/guide.png"), height: 630 },
    },
    overrides,
  );
}
