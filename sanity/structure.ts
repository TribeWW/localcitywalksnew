import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
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
      S.documentTypeListItem("city").title("Cities"),
      S.documentTypeListItem("country").title("Countries"),
      S.documentTypeListItem("review").title("Tour reviews"),
    ]);
