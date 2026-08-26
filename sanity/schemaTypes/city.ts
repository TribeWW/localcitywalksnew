/**
 * City document schema for Sanity Studio.
 *
 * Synced from Bokun with identity fields (`cityCode`, `country` / `countryCode`).
 * Editors may set region, tour page path, images, description, and SEO overlays.
 */

import { defineField, defineType } from "sanity";
import { Building2 } from "lucide-react";
import { definePlaceDescriptionField } from "./place-description";
import { definePlaceImagesField } from "./place-images";
import {
  definePlaceSeoFields,
  definePlaceSeoFieldset,
} from "./place-seo-fields";

/** Sanity document type for a catalog city (`city`). */
export const city = defineType({
  name: "city",
  title: "City",
  type: "document",
  icon: Building2,
  fieldsets: [definePlaceSeoFieldset()],
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
      name: "region",
      title: "Region",
      type: "reference",
      to: [{ type: "region" }],
      description:
        "Optional region this city belongs to (e.g. Provence). One region per city.",
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
      name: "tourPagePath",
      title: "Tour page path",
      type: "string",
      description:
        "Relative URL to the canonical tour for this city (same path as the city card link), e.g. /tours/toledo/hello-toledo-private-walk-1077682. Leave empty to hide this city from the sitewide footer city list.",
      validation: (rule) =>
        rule.custom<string>((value) => {
          if (value == null || value.trim() === "") return true;
          const v = value.trim();
          if (!v.startsWith("/tours/")) {
            return "Must be a relative path starting with /tours/";
          }
          return true;
        }),
    }),
    definePlaceImagesField({ entityLabel: "city" }),
    definePlaceDescriptionField({ entityLabel: "city" }),
    ...definePlaceSeoFields({ variant: "place" }),
  ],
});
