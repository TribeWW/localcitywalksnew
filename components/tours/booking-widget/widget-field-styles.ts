/**
 * Shared Tailwind class strings for booking widget controls (LOC-1063).
 *
 * Keeps icon-in-field inputs, selects, and primary CTAs visually consistent
 * across step 1 (configuring) and step 2 (contact). Active/focus borders match
 * checkout contact fields (`border-2` + `#1A1A1A`, no focus ring).
 */

import { cn } from "@/lib/utils";

/** Focus/active/open border — aligned with checkout `CHECKOUT_FIELD_FOCUS_CLASS`. */
const WIDGET_FIELD_FOCUS_CLASS =
  "focus:border-2 focus-visible:border-2 active:border-2 focus:border-foreground focus-visible:border-foreground active:border-foreground focus:ring-0 focus-visible:ring-0 active:ring-0 focus-visible:ring-offset-0 data-[state=open]:border-2 data-[state=open]:border-foreground aria-expanded:border-foreground";

/** Trigger/input chrome for icon-in-field controls (date, time, language, contact fields). */
export const WIDGET_FIELD_TRIGGER_CLASS = cn(
  "h-auto min-h-[44px] w-full justify-start border-2 border-border rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-base font-normal text-foreground shadow-none hover:bg-white",
  WIDGET_FIELD_FOCUS_CLASS,
);

/**
 * Layout overrides for widget dropdown triggers (date, time, language).
 * Pairs with `WIDGET_FIELD_TRIGGER_CLASS` so chevrons align right like guests picker.
 */
export const WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS =
  "justify-between *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:text-left";

/** Full-width tangerine primary button used for Check availability, Book now, and Send request. */
export const WIDGET_PRIMARY_BUTTON_CLASS =
  "w-full rounded-lg bg-tangerine py-2.5 px-5 text-base font-medium text-white hover:bg-tangerine/90 disabled:opacity-50 disabled:pointer-events-none";

/**
 * Disabled state for widget fields — matches Radix `SelectTrigger` with placeholder:
 * `disabled:opacity-50` plus muted label colour (same as `data-[placeholder]:text-muted-foreground`).
 */
export const WIDGET_FIELD_DISABLED_CLASS =
  "cursor-not-allowed opacity-50 pointer-events-none text-muted-foreground";

/** Collapsed guests picker trigger — matches widget select/date field chrome. */
export const WIDGET_GUESTS_TRIGGER_CLASS = cn(
  "flex w-full items-center justify-between border-2 border-border bg-white px-3.5 py-2.5 text-base font-normal text-foreground min-h-[44px] shadow-none transition-[border-radius]",
  WIDGET_FIELD_FOCUS_CLASS,
);
