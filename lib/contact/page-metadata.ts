/**
 * Next.js metadata for the contact page.
 */

import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

/** Contact page `<title>` and Open Graph title. */
export const CONTACT_PAGE_TITLE = "Contact Us | LocalCityWalks";

/** Contact page meta description. */
export const CONTACT_PAGE_DESCRIPTION =
  "Get in touch with LocalCityWalks. We usually reply within one business day. For booking questions, include your booking reference.";

export const CONTACT_PAGE_URL = absoluteUrl("/contact");

const CONTACT_OG_IMAGE_URL = absoluteUrl("/guide.png");

/**
 * Builds Next.js metadata for `/contact` including canonical, Open Graph, and Twitter tags.
 */
export function buildContactPageMetadata(): Metadata {
  return {
    title: CONTACT_PAGE_TITLE,
    description: CONTACT_PAGE_DESCRIPTION,
    alternates: {
      canonical: CONTACT_PAGE_URL,
    },
    openGraph: {
      title: CONTACT_PAGE_TITLE,
      description: CONTACT_PAGE_DESCRIPTION,
      url: CONTACT_PAGE_URL,
      type: "website",
      siteName: "LocalCityWalks",
      images: [
        {
          url: CONTACT_OG_IMAGE_URL,
          alt: CONTACT_PAGE_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: CONTACT_PAGE_TITLE,
      description: CONTACT_PAGE_DESCRIPTION,
      images: [CONTACT_OG_IMAGE_URL],
    },
  };
}
