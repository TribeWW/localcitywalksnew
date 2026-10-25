/**
 * page-seo — fetch published page SEO overrides from Sanity.
 *
 * Plain module (not `"use server"`) safe for Server Components and `generateMetadata`.
 */

import { cache } from "react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { PageDocumentId } from "@/sanity/schemaTypes/page.helpers";
import {
  PAGE_OG_IMAGE_HEIGHT,
  PAGE_OG_IMAGE_WIDTH,
  type PageSeoOverrides,
} from "@/lib/pages/page-metadata";

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

/** Published fixed-id `page` document. Drafts are excluded. */
export const PAGE_SEO_QUERY = `*[_type == "page" && _id == $id && ${DRAFT_EXCLUDED}][0]{
  seoTitle,
  metaDescription,
  focusKeyword,
  ogTitle,
  ogDescription,
  ogImage{ asset, crop, hotspot, alt }
}`;

type PageSeoDoc = Omit<PageSeoOverrides, "ogImageUrl" | "ogImageAlt"> & {
  ogImage?:
    | (SanityImageSource & { asset?: unknown; alt?: string | null })
    | null;
};

async function loadPublishedPageSeo(
  id: PageDocumentId,
): Promise<PageSeoOverrides | null> {
  try {
    const doc = await client.fetch<PageSeoDoc | null>(
      PAGE_SEO_QUERY,
      { id },
      { next: { revalidate: 60 } },
    );
    if (!doc) return null;

    const { ogImage, ...fields } = doc;
    return {
      ...fields,
      ogImageUrl: ogImage?.asset
        ? urlFor(ogImage)
            .width(PAGE_OG_IMAGE_WIDTH)
            .height(PAGE_OG_IMAGE_HEIGHT)
            .fit("crop")
            .url()
        : null,
      ogImageAlt: ogImage?.alt ?? null,
    };
  } catch (e) {
    console.error("[Page SEO] Sanity fetch failed", id, e);
    return null;
  }
}

/**
 * Loads published SEO overrides for a fixed-id page document.
 *
 * Fetch failures are logged and return `null`, so the page keeps its code defaults.
 *
 * @param id - Fixed `_id` of the page document (see `PAGE_DOCUMENT_IDS`)
 */
export const getPageSeo = cache(loadPublishedPageSeo);
