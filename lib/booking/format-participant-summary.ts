/**
 * Shared participant label formatting for booking and checkout UIs.
 */

import type { BookingWidgetParticipants } from "@/types/bokun";

/**
 * Builds a readable participant line (e.g. "1 adult, 2 youth, 1 infant").
 * Omits categories with zero count.
 *
 * @param participants - Widget counter values for adults, youth, children, and infants
 */
export function formatParticipantSummary(
  participants: BookingWidgetParticipants,
): string {
  const parts: string[] = [];

  if (participants.adults > 0) {
    parts.push(
      `${participants.adults} adult${participants.adults === 1 ? "" : "s"}`,
    );
  }
  if (participants.youth > 0) {
    parts.push(`${participants.youth} youth`);
  }
  if (participants.children > 0) {
    parts.push(
      `${participants.children} child${participants.children === 1 ? "" : "ren"}`,
    );
  }
  if (participants.infants > 0) {
    parts.push(
      `${participants.infants} infant${participants.infants === 1 ? "" : "s"}`,
    );
  }

  return parts.join(", ");
}
