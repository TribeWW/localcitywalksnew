/**
 * Promo code validation server action entry point (LOC-1230 / LOC-1235 / LOC-1239).
 *
 * Thin `"use server"` wrapper around `runValidatePromoCode` so client components
 * can call it without crossing the server-action module boundary.
 *
 * Bókun checkout-options calls reuse the existing 5s abort timeout in
 * `fetchBokunCheckoutOptions`. Options failures (including timeouts and
 * promo rejections) map to `invalid_promo_code` for Apply UX; flag-off
 * still returns `unavailable`.
 *
 * Logs validation outcomes without the raw promo code string (LOC-1239).
 */

"use server";

import type { ValidatePromoCodeResult } from "@/lib/checkout/promo-code";
import { runValidatePromoCode } from "@/lib/checkout/promo-code";
import { promoCode as promoCodeFlag } from "@/flags";

/**
 * Emits a structured promo validation log without the promo code value.
 *
 * @param result - Outcome returned to the Apply UI
 */
function logPromoValidationOutcome(result: ValidatePromoCodeResult): void {
  if (!result.success) {
    console.info("[promo-code] validate", {
      outcome: "error",
      error: result.error,
    });
    return;
  }

  console.info("[promo-code] validate", {
    outcome: result.data.valid ? "valid" : "invalid",
    originalAmount: result.data.originalAmount,
    discountedAmount: result.data.discountedAmount,
    currency: result.data.currency,
  });
}

/**
 * Validates a promo code via Bókun checkout options (options-only; no reserve).
 *
 * @param input - Untrusted Apply payload (`handoffToken` + `promoCode`)
 */
export async function validatePromoCode(
  input: unknown,
): Promise<ValidatePromoCodeResult> {
  const promoCodeEnabled = await promoCodeFlag();
  if (!promoCodeEnabled) {
    const result: ValidatePromoCodeResult = {
      success: false,
      error: "unavailable",
    };
    logPromoValidationOutcome(result);
    return result;
  }

  const result = await runValidatePromoCode(input);
  logPromoValidationOutcome(result);
  return result;
}
