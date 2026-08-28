/**
 * stacked-overlay-layer — unit specs.
 */

import { describe, expect, it, afterEach } from "vitest";
import { isBookingStackedOverlayOpen } from "@/components/tours/booking-widget/stacked-overlay-layer";

describe("isBookingStackedOverlayOpen", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns false when no portaled layer is open", () => {
    expect(isBookingStackedOverlayOpen()).toBe(false);
  });

  it("returns true when an open dialog content layer is present", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("data-slot", "dialog-content");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    expect(isBookingStackedOverlayOpen()).toBe(true);
  });
});
