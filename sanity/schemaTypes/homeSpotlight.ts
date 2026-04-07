import { defineField, defineType } from "sanity";
import BokunSpotlightItemInput from "../components/BokunSpotlightItemInput";

const SAFE_BOKUN_ID_REGEX = /^\d+$/;

export const homeSpotlight = defineType({
  name: "homeSpotlight",
  title: "Home spotlight",
  type: "document",
  preview: {
    prepare: () => ({
      title: "Spotlight Activities",
    }),
  },
  fields: [
    defineField({
      name: "items",
      title: "Spotlight items",
      type: "array",
      description:
        "Ordered list of up to 8 Bokun product IDs. The site renders them in this order.",
      of: [
        {
          type: "object",
          name: "spotlightItem",
          components: {
            input: BokunSpotlightItemInput,
          },
          fields: [
            defineField({
              name: "bokunProductId",
              title: "Bokun product",
              type: "string",
              description:
                "Bokun activity/product id (e.g. 1077682). Must match the id used in tour URLs.",
              validation: (rule) =>
                rule
                  .required()
                  .regex(
                    SAFE_BOKUN_ID_REGEX,
                    "Use digits only — the Bokun product id from the tour URL",
                  ),
            }),
            defineField({
              name: "bokunProductTitle",
              title: "Selected title",
              type: "string",
              readOnly: true,
              description:
                "Shown in Studio for clarity. The frontend uses bokunProductId.",
            }),
          ],
          preview: {
            select: { title: "bokunProductTitle", subtitle: "bokunProductId" },
            prepare: ({ title, subtitle }) => ({
              title: title || subtitle,
              subtitle: subtitle ? `ID: ${subtitle}` : undefined,
            }),
          },
        },
      ],
      validation: (rule) => rule.max(8),
    }),
  ],
});
