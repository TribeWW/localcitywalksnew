/**
 * page-metadata — merge Sanity page SEO overrides with code defaults.
 *
 * Shared by the home, explore, and contact page metadata builders. Each field
 * merges on its own: a non-blank Sanity value wins, and an empty or missing
 * value keeps the code default.
 */

import type { Metadata } from "next";

/** Width and height of a Sanity share image after the crop in the loader. */
export const PAGE_OG_IMAGE_WIDTH = 1200;
export const PAGE_OG_IMAGE_HEIGHT = 630;

/** Published page SEO fields, with the share image already resolved to a URL. */
export type PageSeoOverrides = {
  seoTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
};

/** Code defaults for one page: today's hardcoded metadata. */
export type PageMetadataDefaults = {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImage: {
    url: string;
    height?: number;
  };
};

function pick(override: string | null | undefined, fallback: string): string;
function pick(
  override: string | null | undefined,
  fallback: string | undefined,
): string | undefined;
function pick(
  override: string | null | undefined,
  fallback: string | undefined,
): string | undefined {
  const trimmed = override?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Builds Next.js metadata for a page from code defaults and Sanity overrides.
 *
 * The share title and description fall back to the resolved SEO title and
 * description, so they mirror them until an editor sets them.
 *
 * @param defaults - Hardcoded metadata for the page
 * @param overrides - Published Sanity page fields, or null when none exist
 */
export function buildPageMetadata(
  defaults: PageMetadataDefaults,
  overrides: PageSeoOverrides | null,
): Metadata {
  const title = pick(overrides?.seoTitle, defaults.title);
  const description = pick(overrides?.metaDescription, defaults.description);
  const keywords = pick(overrides?.focusKeyword, defaults.keywords);
  const shareTitle = pick(overrides?.ogTitle, title);
  const shareDescription = pick(overrides?.ogDescription, description);

  const sanityImageUrl = overrides?.ogImageUrl?.trim();
  const image = sanityImageUrl
    ? {
        url: sanityImageUrl,
        width: PAGE_OG_IMAGE_WIDTH,
        height: PAGE_OG_IMAGE_HEIGHT,
      }
    : defaults.ogImage;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: defaults.canonicalUrl,
    },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url: defaults.canonicalUrl,
      type: "website",
      siteName: "LocalCityWalks",
      images: [
        {
          ...image,
          alt: pick(overrides?.ogImageAlt, shareTitle),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [image.url],
    },
  };
}
