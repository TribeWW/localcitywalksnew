/**
 * Page SEO document schema (`page`).
 *
 * One fixed-id document per hardcoded site page (home, explore, contact), wired
 * in Studio structure under "Pages". Every field is optional: an empty field
 * keeps the code default for that page.
 */

import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";
import {
  definePlaceSeoFields,
  definePlaceSeoFieldset,
} from "./place-seo-fields";
import { getPageDocumentTitle } from "./page.helpers";

/** Shared SEO fields that the site reads for a page. */
const PAGE_SEO_FIELD_NAMES = new Set([
  "seoTitle",
  "metaDescription",
  "focusKeyword",
]);

const SHARE_FIELDSET = "share";

/** Sanity document type for page-level SEO and share preview overrides. */
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: FileText,
  fieldsets: [
    definePlaceSeoFieldset({ collapsed: false }),
    {
      name: SHARE_FIELDSET,
      title: "Share preview",
      options: { collapsible: true, collapsed: false },
    },
  ],
  fields: [
    ...definePlaceSeoFields().filter((field) =>
      PAGE_SEO_FIELD_NAMES.has(field.name),
    ),
    defineField({
      name: "ogTitle",
      title: "Share title",
      type: "string",
      fieldset: SHARE_FIELDSET,
      description:
        "Title in link previews (Facebook, WhatsApp, X). Empty uses the SEO title.",
      validation: (rule) =>
        rule.max(70).warning("Recommended ≤70 characters for share titles"),
    }),
    defineField({
      name: "ogDescription",
      title: "Share description",
      type: "text",
      rows: 3,
      fieldset: SHARE_FIELDSET,
      description:
        "Description in link previews. Empty uses the meta description.",
      validation: (rule) =>
        rule
          .max(200)
          .warning("Recommended ≤200 characters for share descriptions"),
    }),
    defineField({
      name: "ogImage",
      title: "Share image",
      type: "image",
      fieldset: SHARE_FIELDSET,
      description:
        "Image in link previews, cropped to 1200×630. Empty uses the default site image.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          description: "Empty uses the share title.",
        }),
      ],
    }),
  ],
  preview: {
    select: { id: "_id", seoTitle: "seoTitle" },
    prepare: ({ id, seoTitle }) => ({
      title: getPageDocumentTitle(id),
      subtitle: seoTitle,
    }),
  },
});
