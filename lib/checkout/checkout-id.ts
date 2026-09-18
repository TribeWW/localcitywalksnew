/**
 * Internal checkout id used as Bókun `externalBookingReference` and pending KV key.
 *
 * Format: `WKS` + 9 uppercase alphanumeric characters (12 total).
 * Legacy UUID ids are accepted only until
 * {@link LEGACY_CHECKOUT_ID_SUNSET_AT_MS} (WKS cutover + one handoff TTL).
 */

import { randomBytes } from "crypto";
import { z } from "zod";

import { CHECKOUT_HANDOFF_TTL_SECONDS } from "@/lib/checkout/handoff-token";

/** Fixed prefix for LocalCityWalks checkout / Bokun external references. */
export const CHECKOUT_ID_PREFIX = "WKS";

/** Number of random alphanumeric characters after the prefix. */
export const CHECKOUT_ID_SUFFIX_LENGTH = 9;

/**
 * Instant WKS checkout ids started shipping. Legacy UUID acceptance lasts one
 * {@link CHECKOUT_HANDOFF_TTL_SECONDS} afterward (pending Redis row lifetime).
 */
export const CHECKOUT_ID_WKS_CUTOVER_AT_MS = Date.parse(
  "2026-09-18T21:00:00.000Z",
);

/** After this instant, {@link resolvableCheckoutIdSchema} rejects UUID ids. */
export const LEGACY_CHECKOUT_ID_SUNSET_AT_MS =
  CHECKOUT_ID_WKS_CUTOVER_AT_MS + CHECKOUT_HANDOFF_TTL_SECONDS * 1000;

const CHECKOUT_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const legacyUuidCheckoutIdSchema = z.string().uuid();

/** Zod schema for new internal checkout ids (`WKS` + 9 A–Z0–9). */
export const checkoutIdSchema = z
  .string()
  .regex(
    new RegExp(`^${CHECKOUT_ID_PREFIX}[A-Z0-9]{${CHECKOUT_ID_SUFFIX_LENGTH}}$`),
  );

/**
 * Returns whether legacy UUID checkout ids may still be resolved.
 *
 * @param nowMs - Clock for tests; defaults to `Date.now()`
 */
export function isLegacyCheckoutIdAccepted(nowMs: number = Date.now()): boolean {
  return nowMs < LEGACY_CHECKOUT_ID_SUNSET_AT_MS;
}

/**
 * Accepts WKS ids always. Accepts legacy UUID ids only before
 * {@link LEGACY_CHECKOUT_ID_SUNSET_AT_MS}. New ids must still be generated via
 * {@link generateCheckoutId}.
 */
export const resolvableCheckoutIdSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (checkoutIdSchema.safeParse(value).success) {
      return;
    }
    if (
      isLegacyCheckoutIdAccepted() &&
      legacyUuidCheckoutIdSchema.safeParse(value).success
    ) {
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid checkout id",
    });
  });

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
