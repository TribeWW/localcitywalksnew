/**
 * place-seo-fields — shared flat SEO field definitions for Sanity documents.
 *
 * Used by city, country, region, and tour SEO schemas so title/description/
 * keyword/AI/FAQ/sameAs stay single-sourced. Fields stay flat on the document
 * but render in a collapsible Studio fieldset (`seo`). FAQ min(2) only when
 * `faqRequired: true` (tour documents).
 */

import { defineArrayMember, defineField } from "sanity";
import type { FieldDefinition, FieldsetDefinition } from "sanity";
import {
  PLACE_SEO_FAQ_MIN_WHEN_REQUIRED,
  PLACE_SEO_FIELDSET_NAME,
  getPlaceSeoCopy,
  resolvePlaceSeoFieldOptions,
  resolvePlaceSeoFieldsetOptions,
  validateOptionalNonBlankString,
  type PlaceSeoFieldOptions,
  type PlaceSeoFieldsetOptions,
} from "./place-seo-fields.helpers";

/**
 * Builds the document `fieldsets` entry for the shared SEO group.
 *
 * @param options - Collapse default (see {@link PlaceSeoFieldsetOptions})
 * @returns A Sanity fieldset definition to include on the document type
 */
export function definePlaceSeoFieldset(
  options?: PlaceSeoFieldsetOptions,
): FieldsetDefinition {
  const resolved = resolvePlaceSeoFieldsetOptions(options);
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
 * Builds the shared SEO fields for a place or tour document.
 *
 * Each field is assigned to {@link PLACE_SEO_FIELDSET_NAME}; the document must
 * also include {@link definePlaceSeoFieldset} in its `fieldsets` array.
 *
 * @param options - `faqRequired` / `variant` (see {@link PlaceSeoFieldOptions})
 * @returns Sanity field definitions to append to a document `fields` array
 */
export function definePlaceSeoFields(
  options?: PlaceSeoFieldOptions,
): FieldDefinition[] {
  const { faqRequired, variant } = resolvePlaceSeoFieldOptions(options);
  const copy = getPlaceSeoCopy(variant);
  const fieldset = PLACE_SEO_FIELDSET_NAME;

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
    defineField({
      name: "aiSummary",
      title: "AI Summary",
      type: "text",
      rows: 4,
      fieldset,
      description: copy.aiSummary,
      validation: (rule) =>
        rule.max(500).error("Keep the AI summary ≤500 characters"),
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      fieldset,
      of: [defineArrayMember({ type: "faqItem" })],
      description: copy.faq,
      validation: faqRequired
        ? (rule) =>
            rule
              .required()
              .min(PLACE_SEO_FAQ_MIN_WHEN_REQUIRED)
              .error(
                `Add at least ${PLACE_SEO_FAQ_MIN_WHEN_REQUIRED} tour-specific FAQ items`,
              )
        : undefined,
    }),
    defineField({
      name: "sameAsUrl",
      title: "Same As URL",
      type: "url",
      fieldset,
      description: copy.sameAsUrl,
      validation: (rule) =>
        rule.uri({
          scheme: ["http", "https"],
        }),
    }),
  ];
}
