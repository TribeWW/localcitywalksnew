import type { StructureResolver } from "sanity/structure";

/**
 * Studio desk structure.
 *
 * Singletons (`homeSpotlight`, `promoBanner`) are fixed-id editors only — they
 * must not appear as generic document type lists.
 *
 * @see https://www.sanity.io/docs/structure-builder-cheat-sheet
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Home spotlight")
        .child(
          S.document()
            .schemaType("homeSpotlight")
            .documentId("homeSpotlight"),
        ),
      S.listItem()
        .title("Promo banner")
        .child(
          S.document().schemaType("promoBanner").documentId("promoBanner"),
        ),
      S.documentTypeListItem("city").title("Cities"),
      S.documentTypeListItem("country").title("Countries"),
      S.documentTypeListItem("review").title("Tour reviews"),
      S.documentTypeListItem("tourSeoMetadata").title("Tour SEO"),
    ]);
