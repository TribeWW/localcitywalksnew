/**
 * Page document schema for Sanity Studio.
 *
 * Plain documents for site pages (Homepage, Explore, Contact, or any new page).
 * The editable `title` drives the Studio header; SEO + social share fields come
 * from `definePageSeoFields`.
 */

import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";
import {
  definePageSeoFields,
  definePageSeoFieldset,
} from "./page-seo-fields";

/** Sanity document type for site pages (`page`). */
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: FileText,
  fieldsets: [definePageSeoFieldset()],
  fields: [
    defineField({
      name: "title",
      title: "Page name",
      type: "string",
      description: "Shown in Studio lists and the document header.",
      validation: (rule) => rule.required().error("Add a page name"),
    }),
    ...definePageSeoFields(),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
