/**
 * Promo Banner Sanity singleton schema (`promoBanner`).
 *
 * Ops-editable sitewide offer bar: enable/disable, headline, code, and schedule.
 * Document id `promoBanner` is wired in Studio structure (Phase 2 Task 2).
 */

import { defineField, defineType } from "sanity";
import { Megaphone } from "lucide-react";
import {
  validatePromoBannerEndsAfterStarts,
  validatePromoBannerRequiredWhenEnabled,
} from "./promo-banner.helpers";

/** Sanity document type for the sitewide promotional banner singleton. */
export const promoBanner = defineType({
  name: "promoBanner",
  title: "Promo banner",
  type: "document",
  icon: Megaphone,
  preview: {
    prepare: () => ({
      title: "Promo banner",
    }),
  },
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      description:
        "When off, the banner is hidden sitewide even if dates and copy are set.",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      description: "Short message shown in the bar (plain text, no HTML).",
      validation: (rule) =>
        rule.custom((value, context) =>
          validatePromoBannerRequiredWhenEnabled(
            value,
            context.document?.enabled,
          ),
        ),
    }),
    defineField({
      name: "promoCode",
      title: "Promo code",
      type: "string",
      description:
        "Code visitors can copy. Validity is still checked by Bókun at checkout.",
      validation: (rule) =>
        rule.custom((value, context) =>
          validatePromoBannerRequiredWhenEnabled(
            value,
            context.document?.enabled,
          ),
        ),
    }),
    defineField({
      name: "startsAt",
      title: "Starts at",
      type: "datetime",
      description: "Offer becomes eligible at this time (inclusive).",
      options: { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" },
      validation: (rule) =>
        rule.custom((value, context) =>
          validatePromoBannerRequiredWhenEnabled(
            value,
            context.document?.enabled,
          ),
        ),
    }),
    defineField({
      name: "endsAt",
      title: "Ends at",
      type: "datetime",
      description:
        "Offer stops being eligible at this time (exclusive on the site).",
      options: { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" },
      validation: (rule) =>
        rule
          .custom((value, context) =>
            validatePromoBannerRequiredWhenEnabled(
              value,
              context.document?.enabled,
            ),
          )
          .custom((value, context) =>
            validatePromoBannerEndsAfterStarts(
              value,
              context.document?.startsAt,
            ),
          ),
    }),
  ],
});
