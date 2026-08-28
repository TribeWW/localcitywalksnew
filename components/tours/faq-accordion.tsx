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

export default function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className=" py-4 pr-1 text-[15px] leading-6 font-semibold text-nightsky hover:underline cursor-pointer sm:py-6 sm:text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 pr-6 text-[15px] leading-6 text-foreground sm:pb-5 sm:text-base">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
