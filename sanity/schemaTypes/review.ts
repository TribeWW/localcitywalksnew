import { defineField, defineType } from "sanity";

export const review = defineType({
  name: "review",
  title: "Review",
  type: "document",
  fields: [
    defineField({
      name: "tourId",
      title: "Tour ID (Bokun product id)",
      type: "string",
      description:
        "Numeric product id from the public tour URL (the suffix after the slug, e.g. …-12345). Must match the id the site uses for that tour.",
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d+$/, "Use digits only — the Bokun product id from the tour URL"),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "Star rating from 1 to 5.",
      validation: (rule) =>
        rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: "experienceDate",
      title: "Tour experience date & time",
      type: "datetime",
      description:
        "When the guest took the tour (the experience), not when the review was written or added to Sanity. The marketing site shows only the calendar date (no clock time). Pick a datetime in a consistent way (e.g. local business timezone or noon UTC) so the displayed date matches editorial intent.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "authorName",
      title: "Author display name",
      type: "string",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "body",
      title: "Review text",
      type: "text",
      description: "Optional. Leave empty for a rating-only review.",
    }),
    defineField({
      name: "platform",
      title: "Platform / channel (internal)",
      type: "string",
      description:
        "Optional internal note (e.g. source system). Not shown on the public website.",
    }),
  ],
  preview: {
    select: {
      authorName: "authorName",
      rating: "rating",
      experienceDate: "experienceDate",
    },
    prepare({ authorName, rating, experienceDate }) {
      const title =
        authorName && rating != null
          ? `${authorName} — ${rating}★`
          : "Review";
      const dateLabel =
        experienceDate != null
          ? new Date(experienceDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : undefined;
      return {
        title,
        subtitle: dateLabel ? `Experience: ${dateLabel}` : undefined,
      };
    },
  },
});
