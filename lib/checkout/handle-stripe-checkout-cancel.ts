/**
 * Releases Bókun reserve and marks KV pending row failed after Stripe cancel (LOC-1163).
 *
 * Called when the customer returns via Stripe `cancel_url`. Idempotent when the
 * pending row is already terminal.
 */

import { abortReservedBokunCheckout } from "@/lib/bokun/checkout";
import {
  getPendingCheckoutById,
  updatePendingCheckout,
} from "@/lib/checkout/pending-checkout-store";

/** Terminal statuses that do not require cancel cleanup. */
const TERMINAL_PENDING_CHECKOUT_STATUSES = new Set(["paid", "failed", "expired"]);

export type HandleStripeCheckoutCancelResult =
  | { success: true; releasedReservation: boolean }
  | { success: false; error: "not_found" | "unavailable" };

/**
 * Aborts a Bókun hold and marks the pending checkout failed after Stripe cancel.
 *
 * @param checkoutId - Internal checkout uuid from cancel return query params
 */
export async function handleStripeCheckoutCancel(
  checkoutId: string,
): Promise<HandleStripeCheckoutCancelResult> {
  const pending = await getPendingCheckoutById(checkoutId);
  if (!pending) {
    return { success: false, error: "not_found" };
  }

  if (TERMINAL_PENDING_CHECKOUT_STATUSES.has(pending.status)) {
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
    }
  }

  const updateResult = await updatePendingCheckout(checkoutId, {
    status: "failed",
  });

  if (!updateResult.success) {
    return { success: false, error: "unavailable" };
  }

  return { success: true, releasedReservation };
}
