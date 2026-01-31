import { defineField, defineType } from "sanity";

export const country = defineType({
  name: "country",
  title: "Country",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Full country name (e.g. France, Spain)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "iso2",
      title: "ISO2 Code",
      type: "string",
      description: "Two-letter ISO 3166-1 alpha-2 country code (e.g. FR, ES)",
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .regex(/^[A-Z]{2}$/, "Must be 2 uppercase letters (ISO2)"),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "string",
      description: "URL-friendly identifier for future use (e.g. france)",
    }),
  ],
});
