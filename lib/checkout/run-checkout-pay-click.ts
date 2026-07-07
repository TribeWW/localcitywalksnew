/**
 * Client-side Pay CTA handler for checkout summary (LOC-1162 / PRD Task 3.4).
 *
 * Invokes `initiateCheckoutPayment` and normalizes the result for UI handling
 * (Stripe redirect vs error toast). Injectable for unit tests.
 */

import type { InitiateCheckoutPaymentInput } from "@/lib/validation/checkout-payment";
import type { InitiateCheckoutPaymentResult } from "@/types/bokun";

/** Discriminated outcome from a Pay click — redirect or surfaced error copy. */
export type CheckoutPayClickOutcome =
  | { type: "redirect"; redirectUrl: string }
  | { type: "error"; error: string };

/** Injectable server-action signature for tests and the summary view. */
export type InitiateCheckoutPaymentFn = (
  input: InitiateCheckoutPaymentInput,
) => Promise<InitiateCheckoutPaymentResult>;

/**
 * Runs the Pay server action and maps success/failure to a UI outcome.
 *
 * @param initiatePayment - `initiateCheckoutPayment` server action (or test mock)
 * @param input - Validated payment payload from `buildInitiateCheckoutPaymentInput`
 */
export async function runCheckoutPayClick(
  initiatePayment: InitiateCheckoutPaymentFn,
  input: InitiateCheckoutPaymentInput,
): Promise<CheckoutPayClickOutcome> {
  const result = await initiatePayment(input);

  if (result.success) {
    return { type: "redirect", redirectUrl: result.redirectUrl };
  }

  return { type: "error", error: result.error };
}
