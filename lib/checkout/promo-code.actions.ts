/**
 * Promo code validation server action entry point (LOC-1230).
 *
 * Thin `"use server"` wrapper around `runValidatePromoCode` so client components
 * can call it without crossing the server-action module boundary.
 */

"use server";

import type { ValidatePromoCodeResult } from "@/lib/checkout/promo-code";
import { runValidatePromoCode } from "@/lib/checkout/promo-code";
import { promoCode as promoCodeFlag } from "@/flags";

/**
 * Validates a promo code via Bókun checkout options (options-only; no reserve).
 */
export async function validatePromoCode(
  input: unknown,
): Promise<ValidatePromoCodeResult> {
  const promoCodeEnabled = await promoCodeFlag();
  if (!promoCodeEnabled) {
    return { success: false, error: "unavailable" };
  }

  return runValidatePromoCode(input);
}

