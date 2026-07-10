/**
 * Shared Tailwind class strings for checkout form controls (LOC-1147 / LOC-1151).
 *
 * Matches design brief borders and DESIGN_SYSTEM.md brand tokens.
 */

import { cn } from "@/lib/utils";

/** Summary page max width — design brief §3.1. */
export const CHECKOUT_SUMMARY_MAX_WIDTH_CLASS = "max-w-[1140px]";

/** Success page max width — design brief §4. */
export const CHECKOUT_SUCCESS_MAX_WIDTH_CLASS = "max-w-[600px]";

/** Page horizontal + vertical padding; tighter on mobile. */
export const CHECKOUT_PAGE_PADDING_CLASS =
  "px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20";

/**
 * Summary grid: stacked ≤959px, 1.4fr / 1fr from 960px — design brief §3.1.
 */
export const CHECKOUT_SUMMARY_GRID_CLASS =
  "grid grid-cols-1 items-start gap-8 min-[960px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] min-[960px]:gap-12";

/** Focus/active border for checkout inputs — design brief #1A1A1A. */
const CHECKOUT_FIELD_FOCUS_CLASS =
  "focus:border-2 focus-visible:border-2 active:border-2 focus:border-[#1A1A1A] focus-visible:border-[#1A1A1A] active:border-[#1A1A1A] focus:ring-0 focus-visible:ring-0 active:ring-0";

/** Input/textarea chrome for checkout contact fields. */
export const CHECKOUT_FIELD_CLASS = cn(
  "h-auto min-h-[44px] w-full border-2 border-border rounded-lg bg-white px-3.5 py-2.5 text-base font-normal text-foreground shadow-none",
  CHECKOUT_FIELD_FOCUS_CLASS,
);

/** Checkbox focus ring aligned with checkout fields. */
export const CHECKOUT_CHECKBOX_CLASS = cn(
  "mt-0.5 bg-white",
  CHECKOUT_FIELD_FOCUS_CLASS,
);

/** Full-width tangerine primary CTA for Pay button. */
export const CHECKOUT_PRIMARY_BUTTON_CLASS =
  "w-full rounded-lg bg-tangerine py-2.5 px-5 text-base font-medium text-white hover:bg-tangerine/90 disabled:opacity-50 disabled:pointer-events-none";

/** Inline tangerine CTA (success page — not full width). */
export const CHECKOUT_INLINE_BUTTON_CLASS =
  "rounded-lg bg-tangerine px-6 py-2.5 text-base font-medium text-white hover:bg-tangerine/90";

/** Bordered card shell used by order summary and payment placeholder. */
export const CHECKOUT_CARD_CLASS =
  "rounded-2xl border-[1.5px] border-border bg-white";

/** Card padding — compact on mobile. */
export const CHECKOUT_CARD_PADDING_CLASS = "p-4 sm:p-6";
