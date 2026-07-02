/**
 * Checkout handoff pipeline (LOC-1153).
 *
 * Server re-quote, anti-tamper, and signed token minting. Imported by the
 * `startCheckoutHandoff` server action and unit tests (no `"use server"` here).
 */

import { z } from "zod";

import { computeTourBookingQuote } from "@/lib/actions/booking-widget.actions";
import {
  BOOKING_WIDGET_PRICE_MISMATCH_ERROR,
  clientQuoteMatchesServer,
} from "@/lib/actions/booking-widget-submit";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { signCheckoutHandoffToken } from "@/lib/checkout/handoff-token";
import {
  tourBookingClientQuoteSchema,
  tourBookingQuoteInputSchema,
  type TourBookingQuoteInput,
} from "@/lib/validation/tour-booking";
import type { StartCheckoutHandoffResult } from "@/types/bokun";

/** User-facing error when handoff signing is misconfigured. */
export const CHECKOUT_HANDOFF_UNAVAILABLE_ERROR =
  "Checkout is not available right now. Please try again later.";

/**
 * Validated widget → checkout handoff payload.
 * Slot selection + `clientQuote` only — contact fields are collected on summary.
 */
export const startCheckoutHandoffInputSchema = tourBookingQuoteInputSchema.extend({
  clientQuote: tourBookingClientQuoteSchema,
  productTitle: z.string().trim().min(1).optional(),
});

/** Parsed input for `startCheckoutHandoff`. */
export type StartCheckoutHandoffInput = z.infer<
  typeof startCheckoutHandoffInputSchema
>;

/**
 * Validates untrusted handoff input from the booking widget.
 *
 * @param input - Raw server-action payload
 * @returns Parsed `StartCheckoutHandoffInput` or the first Zod error message
 */
export function parseStartCheckoutHandoffInput(
  input: unknown,
):
  | { success: true; data: StartCheckoutHandoffInput }
  | { success: false; error: string } {
  const result = startCheckoutHandoffInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid checkout handoff request",
    };
  }

  return { success: true, data: result.data };
}

/**
 * Maps handoff input to quote pipeline input.
 *
 * Reuses `clientQuote.currency` so the server re-quote matches the widget display.
 */
export function handoffInputToQuoteInput(
  input: StartCheckoutHandoffInput,
): TourBookingQuoteInput {
  return {
    productId: input.productId,
    date: input.date,
    startTimeId: input.startTimeId,
    participants: input.participants,
    language: input.language,
    currency: input.clientQuote.currency,
  };
}

/**
 * Core handoff pipeline — re-quote, anti-tamper, mint signed token.
 *
 * @param input - Pre-validated `StartCheckoutHandoffInput`
 * @returns Signed redirect URL or a safe user-facing error
 */
export async function executeStartCheckoutHandoff(
  input: StartCheckoutHandoffInput,
): Promise<StartCheckoutHandoffResult> {
  const quoteResult = await computeTourBookingQuote(
    handoffInputToQuoteInput(input),
  );

  if (!quoteResult.success) {
    return { success: false, error: quoteResult.error };
  }

  if (!clientQuoteMatchesServer(input.clientQuote, quoteResult.data)) {
    return { success: false, error: BOOKING_WIDGET_PRICE_MISMATCH_ERROR };
  }

  let productTitle = input.productTitle?.trim();

  if (!productTitle) {
    const detail = await getTourDetailById(input.productId);
    if (detail.success) {
      productTitle = detail.data.title.trim() || undefined;
    }
  }

  try {
    const token = signCheckoutHandoffToken({
      ...handoffInputToQuoteInput(input),
      clientQuote: input.clientQuote,
      productTitle,
    });

    return {
      success: true,
      redirectUrl: `/checkout?h=${encodeURIComponent(token)}`,
    };
  } catch (error) {
    console.error("[checkout-handoff] token signing failed:", error);
    return { success: false, error: CHECKOUT_HANDOFF_UNAVAILABLE_ERROR };
  }
}

/**
 * Validates, re-quotes, and mints a signed checkout handoff token.
 *
 * @param input - Untrusted widget payload
 * @returns `{ success: true, redirectUrl }` or `{ success: false, error }`
 */
export async function runStartCheckoutHandoff(
  input: unknown,
): Promise<StartCheckoutHandoffResult> {
  const parsed = parseStartCheckoutHandoffInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return executeStartCheckoutHandoff(parsed.data);
}
