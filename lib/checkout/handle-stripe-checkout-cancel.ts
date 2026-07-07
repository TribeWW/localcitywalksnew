/**
 * Releases Bókun reserve and marks KV pending row failed after Stripe cancel (LOC-1163).
 *
 * Called when the customer returns via Stripe `cancel_url`. Idempotent when the
 * pending row is paid/expired, already failed without a hold, or a concurrent
 * payment won the race. Failed abort attempts keep the row non-terminal so a
 * later cancel return can retry release.
 */

import { abortReservedBokunCheckout } from "@/lib/bokun/checkout";
import { getPendingCheckoutRedis } from "@/lib/checkout/pending-checkout-redis";
import {
  getPendingCheckoutById,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";

export type HandleStripeCheckoutCancelResult =
  | { success: true; releasedReservation: boolean }
  | { success: false; error: "not_found" | "unavailable" };

/** Statuses that never require Bókun abort or cancel cleanup. */
const NON_CANCELLABLE_PENDING_CHECKOUT_STATUSES = new Set(["paid", "expired"]);

/**
 * Aborts a Bókun hold and marks the pending checkout failed after Stripe cancel.
 *
 * @param checkoutId - Internal checkout uuid from cancel return query params
 */
export async function handleStripeCheckoutCancel(
  checkoutId: string,
): Promise<HandleStripeCheckoutCancelResult> {
  if (!getPendingCheckoutRedis()) {
    return { success: false, error: "unavailable" };
  }

  try {
    const pending = await getPendingCheckoutById(checkoutId);
    if (!pending) {
      return { success: false, error: "not_found" };
    }

    if (NON_CANCELLABLE_PENDING_CHECKOUT_STATUSES.has(pending.status)) {
      return { success: true, releasedReservation: false };
    }

    if (pending.status === "failed" && !pending.bokunConfirmationCode) {
      return { success: true, releasedReservation: false };
    }

    let releasedReservation = false;

    if (pending.bokunConfirmationCode) {
      const aborted = await abortReservedBokunCheckout(
        pending.bokunConfirmationCode,
      );
      releasedReservation = aborted.success;

      if (!aborted.success) {
        console.error(
          `[checkout-cancel] failed to abort Bókun reservation ${pending.bokunConfirmationCode} for checkout ${checkoutId}`,
        );
        return { success: true, releasedReservation: false };
      }
    }

    if (pending.status === "pending") {
      const updateResult = await updatePendingCheckout(
        checkoutId,
        { status: "failed" },
        { expectedStatus: "pending" },
      );

      if (!updateResult.success) {
        if (updateResult.error === "conflict") {
          return { success: true, releasedReservation };
        }

        return { success: false, error: "unavailable" };
      }
    }

    return { success: true, releasedReservation };
  } catch {
    return { success: false, error: "unavailable" };
  }
}
