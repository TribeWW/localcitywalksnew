/**
 * JSON-LD builder for FAQPage structured data from Sanity FAQ rows.
 */

import type { TourSeoFaqItem } from "@/types/tour-seo";

const SCHEMA_CONTEXT = "https://schema.org";

/** FAQ Q&A with non-blank question and answer. */
export type ValidFaqItem = {
  question: string;
  answer: string;
};

/**
 * Keeps FAQ rows that have a non-blank question and answer.
 *
 * @param items - Raw Sanity FAQ array (may be null/undefined)
 */
export function filterValidFaqItems(
  items: TourSeoFaqItem[] | null | undefined,
): ValidFaqItem[] {
  if (!items?.length) return [];

  const valid: ValidFaqItem[] = [];
  for (const item of items) {
    const question = item.question?.trim() ?? "";
    const answer = item.answer?.trim() ?? "";
    if (question && answer) {
      valid.push({ question, answer });
    }
  }
  return valid;
}

/**
 * Builds a schema.org `FAQPage` document from valid FAQ items.
 *
 * @param items - Non-blank question/answer pairs
 * @returns FAQPage JSON-LD, or `null` when `items` is empty
 */
export function buildFaqPageJsonLd(
  items: ValidFaqItem[],
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
