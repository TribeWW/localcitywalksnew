/**
 * Internal checkout id used as Bókun `externalBookingReference` and pending KV key.
 *
 * Format: `WKS` + 9 uppercase alphanumeric characters (12 total).
 */

import { randomBytes } from "crypto";
import { z } from "zod";

/** Fixed prefix for LocalCityWalks checkout / Bokun external references. */
export const CHECKOUT_ID_PREFIX = "WKS";

/** Number of random alphanumeric characters after the prefix. */
export const CHECKOUT_ID_SUFFIX_LENGTH = 9;

const CHECKOUT_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Zod schema for internal checkout ids (`WKS` + 9 A–Z0–9). */
export const checkoutIdSchema = z
  .string()
  .regex(
    new RegExp(`^${CHECKOUT_ID_PREFIX}[A-Z0-9]{${CHECKOUT_ID_SUFFIX_LENGTH}}$`),
  );

/**
 * Generates a cryptographically random checkout id for Bokun + pending KV.
 */
export function generateCheckoutId(): string {
  const bytes = randomBytes(CHECKOUT_ID_SUFFIX_LENGTH);
  let suffix = "";
  for (let i = 0; i < CHECKOUT_ID_SUFFIX_LENGTH; i++) {
    suffix += CHECKOUT_ID_ALPHABET[bytes[i]! % CHECKOUT_ID_ALPHABET.length];
  }
  return `${CHECKOUT_ID_PREFIX}${suffix}`;
}
