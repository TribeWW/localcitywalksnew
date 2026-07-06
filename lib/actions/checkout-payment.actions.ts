/**
 * Checkout payment server action entry point (LOC-1161).
 *
 * Thin `"use server"` wrapper around `runInitiateCheckoutPayment` so tests can
 * import the pipeline from `@/lib/checkout/initiate-checkout-payment` without
 * crossing the server-action module boundary.
 */

"use server";

import { runInitiateCheckoutPayment } from "@/lib/checkout/initiate-checkout-payment";
import type { InitiateCheckoutPaymentResult } from "@/types/bokun";

/**
 * Validates contact + terms, re-quotes, reserves in Bókun, persists KV pending
 * row, creates a Stripe hosted Checkout Session, and returns the redirect URL.
 *
 * @param input - Untrusted Pay-click payload from checkout summary
 */
export async function initiateCheckoutPayment(
  input: unknown,
): Promise<InitiateCheckoutPaymentResult> {
  return runInitiateCheckoutPayment(input);
}
