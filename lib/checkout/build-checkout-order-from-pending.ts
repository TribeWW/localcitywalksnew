/**
 * Builds checkout order summary display data from a KV pending row (LOC-1167).
 */

import { formatParticipantSummary } from "@/lib/booking/format-participant-summary";
import { formatCheckoutDateLabel } from "@/lib/checkout/build-checkout-order-from-handoff";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";
import type { CheckoutOrderFixture } from "@/components/checkout/checkout-mock-fixture";

/** Inputs required to render success recap from a fulfilled pending checkout. */
export interface BuildCheckoutOrderFromPendingInput {
  pending: PendingCheckoutRecord;
  productTitle: string;
  imageUrl: string;
  startTimeLabel: string;
}

/**
 * Maps a pending checkout KV row into `CheckoutOrderFixture` for success UI.
 *
 * @param input - Stored checkout row and display metadata from tour detail
 */
export function buildCheckoutOrderFromPending(
  input: BuildCheckoutOrderFromPendingInput,
): CheckoutOrderFixture {
  const { pending, productTitle, imageUrl, startTimeLabel } = input;

  return {
    imageUrl,
    imageAlt: productTitle,
    title: productTitle,
    dateLabel: formatCheckoutDateLabel(pending.date),
    timeLabel: startTimeLabel,
    participantsLabel: formatParticipantSummary(pending.participants),
    totalAmount: pending.quoteSnapshot.totalAmount,
    currency: pending.quoteSnapshot.currency,
  };
}
