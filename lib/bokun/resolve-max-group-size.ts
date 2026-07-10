/**
 * Resolves total group size cap from Bókun availability slot `rates[]`.
 *
 * `maxPerBooking` is the max total guests per booking (adults + youth + children + infants).
 * Distinct from per-category `maxParticipantsRequired` pricing tier bands.
 */

import type { BokunAvailability } from "@/types/bokun";

/**
 * Returns `maxPerBooking` for the applicable rate on an availability slot.
 *
 * Rate lookup order: `defaultRateId` arg → `slot.defaultRateId` → first `rates[]` row.
 *
 * @param slot - Availability row from `fetchAvailabilities`
 * @param defaultRateId - Product default rate id from activity detail
 */
export function resolveMaxGroupSize(
  slot: BokunAvailability | null | undefined,
  defaultRateId?: number | null,
): number | null {
  if (!slot?.rates?.length) {
    return null;
  }

  const preferredRateId = defaultRateId ?? slot.defaultRateId;
  const rate =
    (preferredRateId != null
      ? slot.rates.find((row) => row.id === preferredRateId)
      : undefined) ?? slot.rates[0];

  const maxPerBooking = rate?.maxPerBooking;
  if (
    maxPerBooking == null ||
    !Number.isFinite(maxPerBooking) ||
    maxPerBooking <= 0
  ) {
    return null;
  }

  return Math.floor(maxPerBooking);
}
