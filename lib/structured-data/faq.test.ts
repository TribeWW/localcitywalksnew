/**
 * structured-data/faq — unit tests for FAQPage JSON-LD helpers.
 */

import { describe, expect, it } from "vitest";
import {
  buildFaqPageJsonLd,
  filterValidFaqItems,
} from "@/lib/structured-data/faq";

describe("filterValidFaqItems", () => {
  it("keeps items with non-blank question and answer", () => {
    expect(
      filterValidFaqItems([
        { _key: "a", question: "How long is the tour?", answer: "Two hours." },
        { _key: "b", question: "  ", answer: "Nope" },
        { _key: "c", question: "Where does it start?", answer: "   " },
        { _key: "d", question: null, answer: "Missing question" },
      ]),
    ).toEqual([
      { question: "How long is the tour?", answer: "Two hours." },
    ]);
  });

  it("returns an empty array for null, undefined, or empty input", () => {
    expect(filterValidFaqItems(null)).toEqual([]);
    expect(filterValidFaqItems(undefined)).toEqual([]);
    expect(filterValidFaqItems([])).toEqual([]);
  });
});

describe("buildFaqPageJsonLd", () => {
  it("returns null when there are no valid items", () => {
    expect(buildFaqPageJsonLd([])).toBeNull();
  });

  it("builds a FAQPage with Question and acceptedAnswer nodes", () => {
    expect(
      buildFaqPageJsonLd([
        { question: "How long is the Hello Arles tour?", answer: "2 hours." },
        { question: "Where does it start?", answer: "At the tourist office." },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How long is the Hello Arles tour?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "2 hours.",
          },
        },
        {
          "@type": "Question",
          name: "Where does it start?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "At the tourist office.",
          },
        },
      ],
    });
  });
});
