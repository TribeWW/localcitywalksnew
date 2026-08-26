/**
 * place-images — shared `images` field for city, country, and region documents.
 *
 * Matches the city image array shape: hotspot, required alt, optional caption,
 * grid layout in Studio.
 */

import { defineField } from "sanity";

/**
 * Options for the shared place images field.
 */
export type PlaceImagesFieldOptions = {
  /**
   * Noun used in the field description (e.g. `"city"`, `"country"`, `"region"`).
   * Defaults to `"place"`.
   */
  entityLabel?: string;
};

/**
 * Builds the shared multi-image field used on place documents.
 *
 * @param options - Optional entity label for the Studio description
 * @returns A Sanity `images` field definition
 */
export function definePlaceImagesField(options?: PlaceImagesFieldOptions) {
  const entityLabel = options?.entityLabel?.trim() || "place";

  return defineField({
    name: "images",
    title: "Images",
    type: "array",
    description: `Upload multiple images for this ${entityLabel}. Drag and drop multiple files to upload at once.`,
    of: [
      {
        type: "image",
        options: {
          hotspot: true,
        },
        fields: [
          {
            name: "alt",
            type: "string",
            title: "Alternative text",
            description: "Important for accessibility and SEO",
            validation: (rule) => rule.required(),
          },
          {
            name: "caption",
            type: "string",
            title: "Caption",
            description: "Optional caption for the image",
          },
        ],
      },
    ],
    options: {
      layout: "grid",
    },
  });
}
