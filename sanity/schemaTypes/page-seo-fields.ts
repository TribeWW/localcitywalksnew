/**
 * page-seo-fields — shared flat SEO field definitions for Sanity page documents.
 *
 * Used by the `page` document (and future page types) so title/description/
 * keyword/share image stay single-sourced. Fields stay flat on the document
 * but render in a collapsible Studio fieldset (`seo`).
 */

import { defineField } from "sanity";
import type { FieldDefinition, FieldsetDefinition } from "sanity";
import {
  PAGE_SEO_FIELDSET_NAME,
  resolvePageSeoFieldsetOptions,
  validateOptionalNonBlankString,
  type PageSeoFieldsetOptions,
} from "./page-seo-fields.helpers";
import { defineSocialShareImageField } from "./social-share-image-field";

/**
 * Builds the document `fieldsets` entry for the shared page SEO group.
 *
 * @param options - Collapse default (see {@link PageSeoFieldsetOptions})
 * @returns A Sanity fieldset definition to include on the document type
 */
export function definePageSeoFieldset(
  options?: PageSeoFieldsetOptions,
): FieldsetDefinition {
  const resolved = resolvePageSeoFieldsetOptions(options);
  return {
    name: resolved.name,
    title: resolved.title,
    options: {
      collapsible: resolved.collapsible,
      collapsed: resolved.collapsed,
    },
  };
}

/**
 * Builds the shared SEO fields for a page document.
 *
 * Each field is assigned to {@link PAGE_SEO_FIELDSET_NAME}; the document must
 * also include {@link definePageSeoFieldset} in its `fieldsets` array.
 *
 * @returns Sanity field definitions to append to a document `fields` array
 */
export function definePageSeoFields(): FieldDefinition[] {
  const fieldset = PAGE_SEO_FIELDSET_NAME;

  return [
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      fieldset,
      description: "Google title tag (recommended ≤60 characters).",
      validation: (rule) =>
        rule
          .custom((value) =>
            validateOptionalNonBlankString(
              value,
              "Leave empty or enter a non-blank SEO title",
            ),
          )
          .max(60)
          .warning("Recommended ≤60 characters for Google title tags"),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      fieldset,
      description: "Google snippet description (recommended ≤160 characters).",
      validation: (rule) =>
        rule
          .custom((value) =>
            validateOptionalNonBlankString(
              value,
              "Leave empty or enter a non-blank meta description",
            ),
          )
          .max(160)
          .warning("Recommended ≤160 characters for Google meta descriptions"),
    }),
    defineField({
      name: "focusKeyword",
      title: "Focus Keyword",
      type: "string",
      fieldset,
      description: "Primary keyword (for tracking only).",
    }),
    defineField({
      name: "secondaryKeywords",
      title: "Secondary Keywords",
      type: "array",
      fieldset,
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description: "Additional keywords (for tracking only).",
    }),
    defineSocialShareImageField({ useFieldset: true }),
  ];
}
