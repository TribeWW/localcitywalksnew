import type { StructureResolver } from "sanity/structure";
import { FileText, Megaphone, Star } from "lucide-react";
import { PAGE_DOCUMENT_TITLES } from "./schemaTypes/page.helpers";

/**
 * Studio desk structure.
 *
 * Singletons (`homeSpotlight`, `promoBanner`, and the `page` documents under
 * "Pages") are fixed-id editors only — they
 * must not appear as generic document type lists. Schema `icon` alone does not
 * appear for custom `listItem` singletons; set `.icon()` on the list item.
 *
 * @see https://www.sanity.io/docs/structure-builder-cheat-sheet
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Home spotlight")
        .icon(Star)
        .child(
          S.document().schemaType("homeSpotlight").documentId("homeSpotlight"),
        ),
      S.listItem()
        .title("Promo banner")
        .icon(Megaphone)
        .child(
          S.document().schemaType("promoBanner").documentId("promoBanner"),
        ),
      S.listItem()
        .title("Pages")
        .icon(FileText)
        .child(
          S.list()
            .title("Pages")
            .items(
              Object.entries(PAGE_DOCUMENT_TITLES).map(([id, title]) =>
                S.listItem()
                  .id(id)
                  .title(title)
                  .icon(FileText)
                  .child(S.document().schemaType("page").documentId(id)),
              ),
            ),
        ),
      S.documentTypeListItem("city").title("Cities"),
      S.documentTypeListItem("country").title("Countries"),
      S.documentTypeListItem("region").title("Regions"),
      S.documentTypeListItem("review").title("Tour reviews"),
      S.documentTypeListItem("tourSeoMetadata").title("Tour SEO"),
    ]);
