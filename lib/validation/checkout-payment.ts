/**
 * Zod validation for `initiateCheckoutPayment` (LOC-1161 / PRD Task 3.3).
 *
 * Contact + terms are collected on the summary page; handoff token carries
 * slot selection only. `clientQuote` is shape-validated and anti-tamper checked
 * server-side against a fresh Bókun re-quote.
 */

import { z } from "zod";

import { tourBookingClientQuoteSchema } from "@/lib/validation/tour-booking";

/** Optional international phone — aligned with widget submit validation. */
const checkoutPaymentPhoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      return phoneRegex.test(value.replace(/\s/g, ""));
    },
    {
      message:
        "Please enter a valid phone number with country code (e.g., +1 234 567 8900)",
    },
  );

/** Contact fields submitted with Pay on the checkout summary page. */
export const checkoutPaymentContactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "Please enter your first name" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Please enter your last name" }),
  email: z.string().trim().email({
    message: "Please enter a valid email address",
  }),
  phone: checkoutPaymentPhoneSchema,
  comments: z.string().trim().optional(),
});

/** Untrusted Pay-click payload for `initiateCheckoutPayment`. */
export const initiateCheckoutPaymentInputSchema = z.object({
  handoffToken: z
    .string()
    .trim()
    .min(1, { message: "Checkout session expired. Please return to the tour page." }),
  contact: checkoutPaymentContactSchema,
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to the terms to continue",
    }),
  }),
  clientQuote: tourBookingClientQuoteSchema,
});

/** Parsed contact fields for pending-checkout persistence. */
export type CheckoutPaymentContact = z.infer<
  typeof checkoutPaymentContactSchema
>;

/** Validated input for the checkout payment pipeline. */
export type InitiateCheckoutPaymentInput = z.infer<
  typeof initiateCheckoutPaymentInputSchema
>;

/**
 * Validates untrusted Pay-click input from the checkout summary page.
 *
 * @param input - Raw server-action payload
 */
export function parseInitiateCheckoutPaymentInput(
  input: unknown,
):
  | { success: true; data: InitiateCheckoutPaymentInput }
  | { success: false; error: string } {
  const result = initiateCheckoutPaymentInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ?? "Invalid checkout payment request",
    };
  }

  return { success: true, data: result.data };
}
