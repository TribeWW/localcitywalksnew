/**
 * page.helpers — fixed document ids for the `page` SEO singletons.
 *
 * Shared by the Studio structure, the schema preview, and the site loaders so
 * the ids stay single-sourced.
 */

/** Fixed `_id` of each page SEO document. */
export const PAGE_DOCUMENT_IDS = {
  home: "homePage",
  explore: "explorePage",
  contact: "contactPage",
} as const;

export type PageDocumentId =
  (typeof PAGE_DOCUMENT_IDS)[keyof typeof PAGE_DOCUMENT_IDS];

/** Studio label for each page SEO document, in desk order. */
export const PAGE_DOCUMENT_TITLES: Record<PageDocumentId, string> = {
  homePage: "Homepage",
  explorePage: "Explore",
  contactPage: "Contact",
};

/**
 * Returns the Studio label for a page document id (draft or published).
 *
 * @param id - `_id` of the page document, with or without the `drafts.` prefix
 */
export function getPageDocumentTitle(id: string | undefined): string {
  const publishedId = id?.replace(/^drafts\./, "");
  return PAGE_DOCUMENT_TITLES[publishedId as PageDocumentId] ?? "Page";
}
