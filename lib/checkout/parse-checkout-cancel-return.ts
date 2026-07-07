/**
 * Parses Stripe Checkout cancel return query params (LOC-1163 / PRD Task 3.5).
 *
 * Stripe `cancel_url` includes `cancelled=1` and the internal checkout id so the
 * summary page can release the Bókun hold and show recovery copy.
 */

import { z } from "zod";

import {
  verifyCheckoutHandoffToken,
  pendingCheckoutHandoffTokenMatches,
} from "@/lib/checkout/handoff-token";
import { getPendingCheckoutById } from "@/lib/checkout/pending-checkout-store";

const checkoutIdSchema = z.string().uuid();

/** Raw search params from `/checkout` after Stripe cancel. */
export interface CheckoutCancelReturnSearchParams {
  h?: string | string[];
  cancelled?: string | string[];
  checkoutId?: string | string[];
}

/** Parsed cancel return — whether cleanup should run and which checkout id to use. */
export interface CheckoutCancelReturnParseResult {
  isPaymentCancelled: boolean;
  /** Unverified checkout id from the URL — authorize before cleanup. */
  checkoutId?: string;
}

/**
 * Normalizes a Next.js search param to a single string when present.
 *
 * @param value - Raw `searchParams` entry
 */
function normalizeSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Detects a Stripe cancel return and extracts the pending checkout id.
 *
 * @param searchParams - `/checkout` query string values
 */
export function parseCheckoutCancelReturn(
  searchParams: CheckoutCancelReturnSearchParams,
): CheckoutCancelReturnParseResult {
  const cancelled = normalizeSearchParam(searchParams.cancelled);
  const checkoutId = normalizeSearchParam(searchParams.checkoutId);

  if (cancelled !== "1" || !checkoutId) {
    return { isPaymentCancelled: false };
  }

  const parsedId = checkoutIdSchema.safeParse(checkoutId);
  if (!parsedId.success) {
    return { isPaymentCancelled: false };
  }

  return {
    isPaymentCancelled: true,
    checkoutId: parsedId.data,
  };
}

/**
 * Returns whether a cancel-return checkout id belongs to the active handoff.
 *
 * Prevents cross-user cleanup when `checkoutId` is tampered while `cancelled=1`.
 *
 * @param handoffToken - Raw `h` query param from `/checkout`
 * @param checkoutId - Parsed pending checkout id from cancel return
 */
export async function authorizeCheckoutCancelCleanup(
  handoffToken: string | undefined,
  checkoutId: string,
): Promise<boolean> {
  const trimmedToken = handoffToken?.trim();
  if (!trimmedToken) {
    return false;
  }

  const verified = verifyCheckoutHandoffToken(trimmedToken);
  if (!verified.success) {
    return false;
  }

  let pending;
  try {
    pending = await getPendingCheckoutById(checkoutId);
  } catch {
    return false;
  }

  if (!pending) {
    return false;
  }

  return pendingCheckoutHandoffTokenMatches(pending, trimmedToken);
}
