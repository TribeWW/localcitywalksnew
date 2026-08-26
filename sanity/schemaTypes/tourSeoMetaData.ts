/**
 * Tour SEO metadata document schema for Sanity Studio.
 *
 * Editors pick a Bokun tour by title, optionally set page title/description overrides,
 * and track keywords internally. One document per tour (`tour.bokunProductId`).
 * Shared SEO fields come from `definePlaceSeoFields` (FAQ optional until backfill).
 */

import { defineField, defineType } from "sanity";
import { Search } from "lucide-react";
import BokunSpotlightItemInput from "../components/BokunSpotlightItemInput";
import {
  isDigitsOnlyBokunProductId,
  prepareTourSeoMetadataPreview,
  validateUniqueTourSeoDocument,
} from "./tour-seo-metadata.helpers";
import {
  definePlaceSeoFields,
  definePlaceSeoFieldset,
} from "./place-seo-fields";

/** Sanity document type for per-tour SEO overrides (`tourSeoMetadata`). */
export const tourSeoMetadata = defineType({
  name: "tourSeoMetadata",
  title: "Tour SEO Meta Data",
  type: "document",
  icon: Search,
  fieldsets: [definePlaceSeoFieldset({ collapsed: false })],
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
                typeof value === "string" && isDigitsOnlyBokunProductId(value)
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
    ...definePlaceSeoFields({ variant: "tour" }),
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
