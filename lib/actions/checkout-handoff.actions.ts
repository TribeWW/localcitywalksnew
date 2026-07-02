/**
 * Checkout handoff server action entry point (LOC-1153).
 *
 * Thin `"use server"` wrapper around `runStartCheckoutHandoff` so tests can
 * import the pipeline from `@/lib/checkout/start-checkout-handoff` without
 * crossing the server-action module boundary.
 */

"use server";

import { runStartCheckoutHandoff } from "@/lib/checkout/start-checkout-handoff";
import type { StartCheckoutHandoffResult } from "@/types/bokun";

/**
 * Validates, re-quotes, and mints a signed checkout handoff token.
 *
 * Called from `BookingWidget` when the customer continues to checkout.
 *
 * @param input - Untrusted widget payload
 * @returns `{ success: true, redirectUrl }` or `{ success: false, error }`
 */
export async function startCheckoutHandoff(
  input: unknown,
): Promise<StartCheckoutHandoffResult> {
  return runStartCheckoutHandoff(input);
}
