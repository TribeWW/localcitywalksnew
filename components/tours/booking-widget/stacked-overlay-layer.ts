/**
 * Z-index and detection helpers for Radix overlays opened inside the mobile
 * booking drawer (drawer shell is `z-[70]`; nested layers must sit above it).
 */

/** Tailwind class for portaled pickers/dialogs above {@link BOOKING_MOBILE_DRAWER_Z_CLASS}. */
export const BOOKING_STACKED_OVERLAY_Z_CLASS = "z-[80]";

/** Tailwind class applied to the full-screen booking drawer shell. */
export const BOOKING_MOBILE_DRAWER_Z_CLASS = "z-[70]";

const OPEN_PORTAL_LAYER_SELECTOR = [
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="select-content"][data-state="open"]',
  '[data-slot="popover-content"][data-state="open"]',
].join(", ");

/**
 * Returns whether a Radix portaled overlay is currently open (date dialog, select, etc.).
 */
export function isBookingStackedOverlayOpen(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector(OPEN_PORTAL_LAYER_SELECTOR) != null;
}
