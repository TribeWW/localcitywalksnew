/**
 * place-description — shared portable-text `description` field for place documents.
 *
 * Used by city and region so rich-text block config stays aligned.
 */

import { defineArrayMember, defineField } from "sanity";

/**
 * Options for the shared place description field.
 */
export type PlaceDescriptionFieldOptions = {
  /**
   * Noun used in the field description (e.g. `"city"`, `"region"`).
   * Defaults to `"place"`.
   */
  entityLabel?: string;
};

/**
 * Builds the shared portable-text description field for place documents.
 *
 * @param options - Optional entity label for the Studio description
 * @returns A Sanity `description` field definition
 */
export function definePlaceDescriptionField(
  options?: PlaceDescriptionFieldOptions,
) {
  const entityLabel = options?.entityLabel?.trim() || "place";

  return defineField({
    name: "description",
    title: "Description",
    type: "array",
    description: `Rich text description of the ${entityLabel}. Use formatting tools for headings, lists, links, etc.`,
    of: [
      defineArrayMember({
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "H1", value: "h1" },
          { title: "H2", value: "h2" },
          { title: "H3", value: "h3" },
          { title: "H4", value: "h4" },
          { title: "Quote", value: "blockquote" },
        ],
        lists: [
          { title: "Bullet", value: "bullet" },
          { title: "Number", value: "number" },
        ],
        marks: {
          decorators: [
            { title: "Strong", value: "strong" },
            { title: "Emphasis", value: "em" },
            { title: "Code", value: "code" },
          ],
          annotations: [
            {
              title: "URL",
              name: "link",
              type: "object",
              fields: [
                {
                  title: "URL",
                  name: "href",
                  type: "url",
                  validation: (rule) =>
                    rule.uri({
                      allowRelative: true,
                      scheme: ["http", "https", "mailto", "tel"],
                    }),
                },
                {
                  title: "Open in new tab",
                  name: "blank",
                  type: "boolean",
                  initialValue: false,
                },
              ],
            },
          ],
        },
      }),
    ],
  });
}
