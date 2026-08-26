/**
 * Sanity document schema for a catalog country.
 *
 * Synced from Bokun via `createIfNotExists` (`syncCountries`). Editors may set
 * `featuredOnExplore` for up to five desktop quick filters on `/explore`, an
 * optional SVG `flagIcon`, plus images and SEO overlays aligned with city/region.
 */

import { defineField, defineType } from "sanity";
import { Globe2 } from "lucide-react";
import FeaturedOnExploreInput from "../components/FeaturedOnExploreInput";
import { validateFeaturedOnExploreCap } from "./country.helpers";
import { definePlaceImagesField } from "./place-images";
import {
  definePlaceSeoFields,
  definePlaceSeoFieldset,
} from "./place-seo-fields";

/** Sanity document type for a catalog country (`country`). */
export const country = defineType({
  name: "country",
  title: "Country",
  type: "document",
  icon: Globe2,
  fieldsets: [definePlaceSeoFieldset()],
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
    defineField({
      name: "featuredOnExplore",
      title: "Featured on explore",
      type: "boolean",
      description:
        "Show this country as a one-click filter on /explore (desktop). Maximum 5 countries at a time.",
      initialValue: false,
      components: { input: FeaturedOnExploreInput },
      validation: (rule) =>
        rule.custom((value, context) =>
          validateFeaturedOnExploreCap(value, context),
        ),
    }),
    defineField({
      name: "flagIcon",
      title: "Flag Icon",
      type: "image",
      options: { accept: "image/svg+xml" },
      description:
        "Small SVG country flag, used in menus/selectors across the site.",
    }),
    definePlaceImagesField({ entityLabel: "country" }),
    ...definePlaceSeoFields({ variant: "place" }),
  ],
});
