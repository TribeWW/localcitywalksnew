/**
 * Reusable FAQ Q&A object for Sanity Studio.
 *
 * Shared shape for Tour SEO (and future Explore page) schemas — tour-specific
 * questions/answers, not a copy of the generic on-page FAQ block.
 */

import { defineField, defineType } from "sanity";
import { CircleHelp } from "lucide-react";

const ANSWER_SUBTITLE_MAX = 80;

/**
 * Truncates `text` for Studio list preview subtitles.
 *
 * @param text - Full answer string (may be empty)
 * @param max - Max characters before appending an ellipsis
 */
function truncateForPreview(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

/** Sanity object type for a single FAQ question and answer (`faqItem`). */
export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ Item",
  type: "object",
  icon: CircleHelp,
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            typeof value === "string" && value.trim() !== ""
              ? true
              : "Question cannot be blank",
          ),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "text",
      rows: 3,
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            typeof value === "string" && value.trim() !== ""
              ? true
              : "Answer cannot be blank",
          )
          .max(250)
          .error("Keep answers ≤250 characters"),
    }),
  ],
  preview: {
    select: {
      question: "question",
      answer: "answer",
    },
    prepare({ question, answer }) {
      const subtitle =
        typeof answer === "string" && answer.trim() !== ""
          ? truncateForPreview(answer, ANSWER_SUBTITLE_MAX)
          : undefined;

      return {
        title:
          typeof question === "string" && question.trim() !== ""
            ? question
            : "FAQ Item",
        subtitle,
      };
    },
  },
});
