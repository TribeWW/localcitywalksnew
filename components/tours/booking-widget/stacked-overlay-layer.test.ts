/**
 * stacked-overlay-layer — unit specs.
 */

import { describe, expect, it, afterEach } from "vitest";
import {
  BOOKING_STACKED_OVERLAY_ATTRIBUTE,
  BOOKING_STACKED_OVERLAY_VALUE,
  isBookingStackedOverlayOpen,
} from "@/components/tours/booking-widget/stacked-overlay-layer";

describe("isBookingStackedOverlayOpen", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns false when no portaled layer is open", () => {
    expect(isBookingStackedOverlayOpen()).toBe(false);
  });

  it("returns true when an open booking-marked overlay is present", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute(BOOKING_STACKED_OVERLAY_ATTRIBUTE, BOOKING_STACKED_OVERLAY_VALUE);
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    expect(isBookingStackedOverlayOpen()).toBe(true);
  });

  it("ignores unrelated open Radix overlays without the booking marker", () => {
    const galleryDialog = document.createElement("div");
    galleryDialog.setAttribute("data-slot", "dialog-content");
    galleryDialog.setAttribute("data-state", "open");
    document.body.appendChild(galleryDialog);

    expect(isBookingStackedOverlayOpen()).toBe(false);
  });
});
