"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

/**
 * Render an accordion containing FAQ entries.
 *
 * @param items - Array of FAQ entries; each item supplies the question shown in the trigger and the answer shown in the content
 * @returns A JSX element with an Accordion where each item becomes a single collapsible entry
 */
export default function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className="py-4 pr-1 text-[15px] leading-6 font-semibold text-[#0F172A] hover:no-underline sm:py-5 sm:text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 pr-6 text-[15px] leading-6 text-[#1A1A1A] sm:pb-5 sm:text-base">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
