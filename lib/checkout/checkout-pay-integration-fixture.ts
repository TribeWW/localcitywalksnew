/**
 * Pure helpers for checkout Pay integration fixture (LOC-1164 / PRD Task 3.6).
 */

import type {
  BookingWidgetParticipants,
  BokunAvailability,
} from "@/types/bokun";

/** Bókun test product used for Pay initiation integration (LOC-1100 spike). */
export const CHECKOUT_PAY_INTEGRATION_PRODUCT_ID = "15686";

/** Default participants for integration runs — single adult. */
export const CHECKOUT_PAY_INTEGRATION_PARTICIPANTS: BookingWidgetParticipants =
  {
    adults: 1,
    youth: 0,
    children: 0,
    infants: 0,
  };

/** Contact payload for automated integration runs. */
export const CHECKOUT_PAY_INTEGRATION_CONTACT = {
  firstName: "Integration",
  lastName: "Test",
  email: "integration-test@localcitywalks.com",
  phone: "+34600000000",
  comments: "",
};

/** Days ahead to search for a bookable slot. */
export const CHECKOUT_PAY_INTEGRATION_AVAILABILITY_LOOKAHEAD_DAYS = 30;

/**
 * Converts a Bókun availability epoch date to `YYYY-MM-DD`.
 *
 * @param epochMs - Slot `date` field from availabilities API
 */
export function toAvailabilityIsoDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Picks the first slot that can be booked now.
 *
 * @param slots - Raw availabilities from Bókun
 */
export function pickFirstBookableAvailabilitySlot(
  slots: BokunAvailability[],
): BokunAvailability | null {
  return (
    slots.find((slot) => !slot.soldOut && !slot.unavailable) ?? null
  );
}

/**
 * Builds inclusive `start`/`end` dates for availabilities lookup.
 */
export function buildCheckoutPayIntegrationAvailabilityRange(): {
  start: string;
  end: string;
} {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  const end = new Date(start);
  end.setUTCDate(
    end.getUTCDate() + CHECKOUT_PAY_INTEGRATION_AVAILABILITY_LOOKAHEAD_DAYS,
  );

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/**
 * Extracts the raw handoff token from `/checkout?h=…` redirect URL.
 *
 * @param redirectUrl - Relative or absolute checkout summary URL
 */
export function extractHandoffTokenFromCheckoutRedirectUrl(
  redirectUrl: string,
): string | null {
  try {
    const url = redirectUrl.startsWith("http")
      ? new URL(redirectUrl)
      : new URL(redirectUrl, "https://checkout.local");
    const token = url.searchParams.get("h")?.trim();
    return token || null;
  } catch {
    return null;
  }
}
