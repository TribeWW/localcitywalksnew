/**
 * Tour SEO metadata document schema for Sanity Studio.
 *
 * Editors pick a Bokun tour by title, optionally set page title/description overrides,
 * and track keywords internally. One document per tour (`tour.bokunProductId`).
 */

import { defineField, defineType } from "sanity";
import { Search } from "lucide-react";
import BokunSpotlightItemInput from "../components/BokunSpotlightItemInput";
import {
  isDigitsOnlyBokunProductId,
  prepareTourSeoMetadataPreview,
  validateUniqueTourSeoDocument,
} from "./tour-seo-metadata.helpers";

/** Sanity document type for per-tour SEO overrides (`tourSeoMetadata`). */
export const tourSeoMetadata = defineType({
  name: "tourSeoMetadata",
  title: "Tour SEO Meta Data",
  type: "document",
  icon: Search,
  validation: (rule) => rule.custom(validateUniqueTourSeoDocument),
  fields: [
    defineField({
      name: "tour",
      title: "Tour",
      type: "object",
      components: { input: BokunSpotlightItemInput },
      fields: [
        defineField({
          name: "bokunProductId",
          title: "Bokun product ID",
          type: "string",
          validation: (rule) =>
            rule
              .required()
              .custom((value) =>
                typeof value === "string" &&
                isDigitsOnlyBokunProductId(value)
                  ? true
                  : "Use digits only — the Bokun product id from the tour URL",
              ),
        }),
        defineField({
          name: "bokunProductTitle",
          title: "Selected title",
          type: "string",
          readOnly: true,
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      description: "Google title tag (recommended ≤60 characters).",
      validation: (rule) =>
        rule.max(60).warning("Recommended ≤60 characters for Google title tags"),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description: "Google snippet description (recommended ≤160 characters).",
      validation: (rule) =>
        rule
          .max(160)
          .warning("Recommended ≤160 characters for Google meta descriptions"),
    }),
    defineField({
      name: "focusKeyword",
      title: "Focus Keyword",
      type: "string",
      description: "Primary keyword (for tracking only).",
    }),
    defineField({
      name: "secondaryKeywords",
      title: "Secondary Keywords",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description: "Additional keywords (for tracking only).",
    }),
  ],
  preview: {
    select: {
      seoTitle: "seoTitle",
      bokunProductTitle: "tour.bokunProductTitle",
      bokunProductId: "tour.bokunProductId",
    },
    prepare: prepareTourSeoMetadataPreview,
  },
});
