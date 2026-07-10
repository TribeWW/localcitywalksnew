/**
 * Shared Tailwind class strings for booking widget controls (LOC-1063).
 *
 * Keeps icon-in-field inputs, selects, and primary CTAs visually consistent
 * across step 1 (configuring) and step 2 (contact).
 */

/** Trigger/input chrome for icon-in-field controls (date, time, language, contact fields). */
export const WIDGET_FIELD_TRIGGER_CLASS =
  "h-auto min-h-[44px] w-full justify-start border-[1.5px] border-border rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-base font-normal text-foreground shadow-none hover:bg-white focus-visible:ring-2 focus-visible:ring-tangerine/30";

/**
 * Layout overrides for widget dropdown triggers (date, time, language).
 * Pairs with `WIDGET_FIELD_TRIGGER_CLASS` so chevrons align right like guests picker.
 */
export const WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS =
  "justify-between *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:text-left";

/** Full-width tangerine primary button used for Check availability, Book now, and Send request. */
export const WIDGET_PRIMARY_BUTTON_CLASS =
  "w-full rounded-lg bg-tangerine py-2.5 px-5 text-base font-medium text-white hover:bg-tangerine/90 disabled:opacity-50 disabled:pointer-events-none";
