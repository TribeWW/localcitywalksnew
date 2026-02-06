import { defineArrayMember, defineField, defineType } from "sanity";

export const city = defineType({
  name: "city",
  title: "City",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      description: "Country this city belongs to",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cityCode",
      title: "City code",
      type: "string",
      readOnly: true,
      description:
        "Unique identifier from Bokun (e.g. Biarritz). Used for document ID.",
      validation: (rule) =>
        rule.required().regex(/^\S+$/, "City code must not contain spaces"),
    }),
    defineField({
      name: "countryCode",
      title: "Country code",
      type: "string",
      readOnly: true,
      description: "ISO2 country code mirrored from Bokun (e.g. FR, ES)",
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .regex(/^[A-Z]{2}$/, "Must be 2 uppercase letters (ISO2)"),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description: "Upload multiple images for this city. Drag and drop multiple files to upload at once.",
      of: [
        {
          type: "image",
          options: {
            hotspot: true, // Enables cropping/focus point selection
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
        layout: "grid", // Displays images in a grid layout
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      description: "Rich text description of the city. Use formatting tools for headings, lists, links, etc.",
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
    }),
  ],
});
