/**
 * Guest category config and unit-price hints for the booking widget (LOC-1063).
 *
 * Maps widget participant fields (`adults`, `youth`, `children`, `infants`) to
 * display labels, age ranges, and stepper bounds. `formatGuestUnitHint` resolves
 * per-category unit prices from a live quote breakdown.
 */

import type { BookingWidgetParticipants, BookingWidgetQuote } from "@/types/bokun";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

/** Participant counter key on `BookingWidgetParticipants`. */
export type GuestCategoryKey = keyof BookingWidgetParticipants;

/** Display and validation config for one guest category row in the picker. */
export interface GuestCategoryConfig {
  /** Counter field name passed to `onChange`. */
  key: GuestCategoryKey;
  /** Plural label shown in the accordion (e.g. "Adults"). */
  label: string;
  /** Human-readable age band (e.g. "18+"). */
  ageRange: string;
  /** Minimum count allowed by the stepper. */
  min: number;
  /** Maximum count allowed by the stepper. */
  max: number;
}

/**
 * Ordered guest categories for the widget accordion.
 * Order matches the LOC-1063 mockup: Adults → Youth → Children → Infants.
 */
export const GUEST_CATEGORIES: GuestCategoryConfig[] = [
  { key: "adults", label: "Adults", ageRange: "18+", min: 0, max: 20 },
  { key: "youth", label: "Youth", ageRange: "13–17", min: 0, max: 20 },
  { key: "children", label: "Children", ageRange: "3–12", min: 0, max: 20 },
  { key: "infants", label: "Infants", ageRange: "0–2", min: 0, max: 20 },
];

/**
 * Returns whether a widget category label matches a Bókun breakdown label.
 * Handles singular/plural differences (e.g. "Adults" ↔ "Adult").
 */
function categoryLabelsMatch(widgetLabel: string, breakdownLabel: string): boolean {
  const widget = widgetLabel.toLowerCase();
  const breakdown = breakdownLabel.toLowerCase();
  return (
    widget === breakdown ||
    widget.startsWith(breakdown) ||
    breakdown.startsWith(widget)
  );
}

/**
 * Formats the per-unit price hint shown under each guest category.
 *
 * @param categoryLabel - Widget label from `GUEST_CATEGORIES` (e.g. "Adults")
 * @param quote - Live quote from `getTourBookingQuote`; `null` before first quote
 * @returns Formatted price (e.g. "€124"), "Free" for zero unit amount, or "—" when unknown
 */
export function formatGuestUnitHint(
  categoryLabel: string,
  quote: BookingWidgetQuote | null,
): string {
  const line = quote?.breakdown.find((item) =>
    categoryLabelsMatch(categoryLabel, item.categoryLabel),
  );
  if (!line) return "—";
  if (line.unitAmount === 0) return "Free";
  const formatted = formatCataloguePriceAmount(line.unitAmount, line.currency);
  return formatted ?? "—";
}
