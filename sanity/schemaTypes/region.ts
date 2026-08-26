/**
 * Region document schema for Sanity Studio.
 *
 * Editorial geography layer between country and city (e.g. Provence, Andalusia).
 * Country is optional so editors can create regions without breaking existing data.
 * Images, description, and SEO fields align with city/country place schemas.
 */

import { defineField, defineType } from "sanity";
import { Map } from "lucide-react";
import { definePlaceDescriptionField } from "./place-description";
import { definePlaceImagesField } from "./place-images";
import {
  definePlaceSeoFields,
  definePlaceSeoFieldset,
} from "./place-seo-fields";
import { prepareRegionPreview } from "./region.helpers";

/** Sanity document type for a geographic region (`region`). */
export const region = defineType({
  name: "region",
  title: "Region",
  type: "document",
  icon: Map,
  fieldsets: [definePlaceSeoFieldset()],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Region display name (e.g. Provence, Andalusia, Bavaria)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      description:
        "Optional country this region belongs to. Leave empty if not yet assigned.",
    }),
    definePlaceImagesField({ entityLabel: "region" }),
    definePlaceDescriptionField({ entityLabel: "region" }),
    ...definePlaceSeoFields({ variant: "place" }),
  ],
  preview: {
    select: {
      name: "name",
      countryName: "country.name",
    },
    prepare: prepareRegionPreview,
  },
});
