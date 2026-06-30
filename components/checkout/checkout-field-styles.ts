/**
 * Shared Tailwind class strings for checkout form controls (LOC-1147).
 *
 * Matches design brief borders and sizing; aligned with booking widget field chrome.
 */

/** Input/textarea chrome for checkout contact fields. */
export const CHECKOUT_FIELD_CLASS =
  "h-auto min-h-[44px] w-full border-[1.5px] border-border rounded-lg bg-white px-3.5 py-2.5 text-base font-normal text-foreground shadow-none focus-visible:ring-2 focus-visible:ring-tangerine/30";

/** Full-width tangerine primary CTA for Pay button. */
export const CHECKOUT_PRIMARY_BUTTON_CLASS =
  "w-full rounded-lg bg-tangerine py-2.5 px-5 text-base font-medium text-white hover:bg-tangerine/90 disabled:opacity-50 disabled:pointer-events-none";

/** Bordered card shell used by order summary and payment placeholder. */
export const CHECKOUT_CARD_CLASS =
  "rounded-2xl border-[1.5px] border-border bg-white";
