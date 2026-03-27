"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Renders a Radix UI Accordion root element and forwards received props.
 *
 * @returns The rendered Accordion root element (`JSX.Element`).
 */
function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

/**
 * Wraps Radix's Accordion Item with default border styling and a data-slot attribute.
 *
 * @param className - Additional CSS class names to merge with the default border styles (`"border-b last:border-b-0"`).
 * @param props - Remaining props are forwarded to the underlying `AccordionPrimitive.Item`.
 * @returns A React element rendering `AccordionPrimitive.Item` with merged `className`, `data-slot="accordion-item"`, and forwarded props.
 */
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

/**
 * Renders an accordion trigger inside a header with a chevron icon that rotates when opened.
 *
 * @param className - Optional additional class names merged with the component's default styling
 * @param children - Content to display inside the trigger
 * @returns The accordion trigger element wrapped in a header, including default classes, state-driven chevron rotation, and all forwarded props
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/**
 * Renders the collapsible content area for an accordion item.
 *
 * The component applies overflow handling, small text sizing, and state-driven open/close animations, and wraps `children` in an inner container that accepts additional spacing or style classes.
 *
 * @param className - Additional CSS classes to apply to the inner content container
 * @param children - Content to display inside the accordion content region
 * @returns The accordion content element
 */
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
