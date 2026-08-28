/**
 * Z-index and detection helpers for Radix overlays opened inside the mobile
 * booking drawer (drawer shell is `z-[70]`; nested layers must sit above it).
 */

/** Tailwind class for portaled pickers/dialogs above {@link BOOKING_MOBILE_DRAWER_Z_CLASS}. */
export const BOOKING_STACKED_OVERLAY_Z_CLASS = "z-[80]";

/** Tailwind class applied to the full-screen booking drawer shell. */
export const BOOKING_MOBILE_DRAWER_Z_CLASS = "z-[70]";

/** DOM attribute marking booking-owned elevated overlays in the mobile drawer. */
export const BOOKING_STACKED_OVERLAY_ATTRIBUTE = "data-booking-stacked-overlay";

/** Attribute value set on elevated booking picker layers. */
export const BOOKING_STACKED_OVERLAY_VALUE = "true";

const OPEN_BOOKING_STACKED_OVERLAY_SELECTOR = `[${BOOKING_STACKED_OVERLAY_ATTRIBUTE}="${BOOKING_STACKED_OVERLAY_VALUE}"][data-state="open"]`;

/**
 * Data attributes for elevated booking overlays (date dialog, time/language selects).
 *
 * @param elevatedLayer - When true, tags the portaled layer for drawer focus/escape handling
 */
export function bookingStackedOverlayDataAttributes(
  elevatedLayer: boolean,
): Record<string, string> {
  return elevatedLayer
    ? { [BOOKING_STACKED_OVERLAY_ATTRIBUTE]: BOOKING_STACKED_OVERLAY_VALUE }
    : {};
}

/**
 * Returns whether a booking-owned elevated overlay is currently open.
 */
export function isBookingStackedOverlayOpen(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector(OPEN_BOOKING_STACKED_OVERLAY_SELECTOR) != null;
}
