/**
 * Booking widget quote calculation from Bókun availability slots.
 *
 * Pure functions used by `getTourBookingQuote` (LOC-1047). Takes rows from
 * `fetchAvailabilities` plus participant counters and returns a
 * `BookingWidgetQuote` or `null` when pricing cannot be resolved.
 *
 * ## Pricing rule (LOC-1040 — per-category band lookup)
 *
 * For each participant category with count > 0:
 * 1. Find `pricePerCategoryUnit` row where `id` matches the Bókun pricing category
 * 2. Pick the band where count ∈ [minParticipantsRequired, maxParticipantsRequired]
 * 3. `lineTotal = count × amount.amount`
 *
 * `grandTotal = sum(lineTotals)`. Do **not** sum all guests and pick one band.
 *
 * Reference product **1079932** (Hello Biarritz): Adult 1045649, Youth 1045650,
 * Child 1045651, Infant 1045652. Validated example: 1 adult + 5 youth + 3 children
 * + 2 infants = **€448**.
 */

import type {
  BokunAvailability,
  BokunAvailabilityPriceByRate,
  BokunPricePerCategoryUnit,
  BokunPricingCategory,
  BookingWidgetParticipants,
  BookingWidgetQuote,
  BookingWidgetQuoteLineItem,
} from "@/types/bokun";

/** Keys on `BookingWidgetParticipants` processed in quote order. */
export type WidgetParticipantField = keyof BookingWidgetParticipants;

/** Participant fields iterated when building quote breakdown lines. */
export const WIDGET_PARTICIPANT_FIELDS: WidgetParticipantField[] = [
  "adults",
  "youth",
  "children",
  "infants",
];

/**
 * Maps each widget counter to a Bókun `pricingCategories[].id`.
 * Resolved via `resolveWidgetCategoryMapping` or passed explicitly in options.
 */
export type BookingWidgetCategoryMapping = Record<WidgetParticipantField, number>;

/** Bókun `ticketCategory` / title aliases used to match widget fields to product categories. */
const TICKET_CATEGORY_ALIASES: Record<WidgetParticipantField, string[]> = {
  adults: ["ADULT"],
  youth: ["TEENAGER", "YOUTH"],
  children: ["CHILD"],
  infants: ["INFANT"],
};

/** Fallback breakdown labels when product `pricingCategories[].title` is absent. */
const DEFAULT_FIELD_LABELS: Record<WidgetParticipantField, string> = {
  adults: "Adult",
  youth: "Youth",
  children: "Child",
  infants: "Infant",
};

/** Optional inputs for category id resolution and breakdown display labels. */
export type CalculateBookingQuoteOptions = {
  /** Pre-resolved Bókun category ids; takes precedence over `pricingCategories`. */
  categoryMapping?: BookingWidgetCategoryMapping;
  /** Product `pricingCategories` from activity detail — resolves ids and labels when mapping omitted. */
  pricingCategories?: BokunPricingCategory[];
};

/**
 * Converts a Bókun slot `date` (epoch ms) to UTC `YYYY-MM-DD`.
 * Used as fallback when `localizedDate` is not in ISO form.
 */
export function toAvailabilityIsoDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Whether an availability slot falls on the requested calendar date.
 * Prefers exact `localizedDate` match, then compares UTC date from `date` epoch.
 */
export function availabilityMatchesDate(
  slot: BokunAvailability,
  date: string,
): boolean {
  if (slot.localizedDate === date) {
    return true;
  }

  return toAvailabilityIsoDate(slot.date) === date;
}

/**
 * Finds the availability row matching a selected date and start time.
 *
 * @param availabilities - Slots from `fetchAvailabilities`
 * @param date - Selected date `YYYY-MM-DD`
 * @param startTimeId - Bókun `startTimes[].id`
 */
export function findAvailabilitySlot(
  availabilities: readonly BokunAvailability[],
  date: string,
  startTimeId: number,
): BokunAvailability | null {
  return (
    availabilities.find(
      (slot) =>
        slot.startTimeId === startTimeId &&
        availabilityMatchesDate(slot, date),
    ) ?? null
  );
}

/**
 * Resolves widget field → Bókun category id from product `pricingCategories`.
 *
 * Matches `ticketCategory` (e.g. `ADULT`, `TEENAGER`) or `title` (case-insensitive).
 * Returns `null` when any of the four widget fields cannot be mapped.
 *
 * @param pricingCategories - From `BokunProductDetail.pricingCategories`
 */
export function resolveWidgetCategoryMapping(
  pricingCategories: readonly BokunPricingCategory[] | undefined,
): BookingWidgetCategoryMapping | null {
  if (!pricingCategories?.length) {
    return null;
  }

  const mapping: Partial<BookingWidgetCategoryMapping> = {};

  for (const field of WIDGET_PARTICIPANT_FIELDS) {
    const aliases = TICKET_CATEGORY_ALIASES[field];
    const match = pricingCategories.find((category) => {
      const ticket = category.ticketCategory?.toUpperCase();
      const title = category.title?.trim().toLowerCase();

      return aliases.some((alias) => {
        const normalizedAlias = alias.toLowerCase();
        return ticket === alias || title === normalizedAlias;
      });
    });

    if (!match) {
      return null;
    }

    mapping[field] = match.id;
  }

  return mapping as BookingWidgetCategoryMapping;
}

/**
 * Selects `pricesByRate` for the product default rate, with slot-level fallbacks.
 * Order: `defaultRateId` arg → slot `defaultRateId` → first rate row.
 */
function pickPriceByRate(
  slot: BokunAvailability,
  defaultRateId: number,
): BokunAvailabilityPriceByRate | null {
  const byDefault = slot.pricesByRate.find(
    (rate) => rate.activityRateId === defaultRateId,
  );
  if (byDefault) {
    return byDefault;
  }

  if (slot.defaultRateId != null) {
    const bySlotDefault = slot.pricesByRate.find(
      (rate) => rate.activityRateId === slot.defaultRateId,
    );
    if (bySlotDefault) {
      return bySlotDefault;
    }
  }

  return slot.pricesByRate[0] ?? null;
}

/**
 * Picks the tier band for a single category using only that category's count.
 * Returns `null` when no row spans [minParticipantsRequired, maxParticipantsRequired].
 */
function pickUnitPriceBand(
  units: readonly BokunPricePerCategoryUnit[],
  categoryId: number,
  count: number,
): BokunPricePerCategoryUnit | null {
  return (
    units.find(
      (unit) =>
        unit.id === categoryId &&
        count >= unit.minParticipantsRequired &&
        count <= unit.maxParticipantsRequired,
    ) ?? null
  );
}

/** Total headcount across all four widget participant counters. */
function sumParticipants(participants: BookingWidgetParticipants): number {
  return (
    participants.adults +
    participants.youth +
    participants.children +
    participants.infants
  );
}

/** Display label for a breakdown line — product title when available, else default. */
function resolveCategoryLabel(
  field: WidgetParticipantField,
  categoryId: number,
  pricingCategories: readonly BokunPricingCategory[] | undefined,
): string {
  const fromProduct = pricingCategories?.find(
    (category) => category.id === categoryId,
  )?.title;

  return fromProduct?.trim() || DEFAULT_FIELD_LABELS[field];
}

/** Resolves category mapping from explicit options or `pricingCategories` lookup. */
function resolveCategoryMapping(
  options: CalculateBookingQuoteOptions | undefined,
): BookingWidgetCategoryMapping | null {
  if (options?.categoryMapping) {
    return options.categoryMapping;
  }

  return resolveWidgetCategoryMapping(options?.pricingCategories);
}

/**
 * Computes a booking quote from cached or freshly fetched availability rows.
 *
 * Server-only pure function — no Bókun HTTP calls. Pair with `fetchAvailabilities`
 * in booking-widget server actions.
 *
 * @param availabilities - Slots from `fetchAvailabilities`
 * @param date - Selected date `YYYY-MM-DD`
 * @param startTimeId - Bókun `startTimes[].id` for the chosen time slot
 * @param participants - Widget counters (`adults`, `youth`, `children`, `infants`)
 * @param defaultRateId - Product `defaultRateId` for `pricesByRate` lookup
 * @param options.categoryMapping - Optional pre-resolved Bókun category ids per field
 * @param options.pricingCategories - Product categories; used when mapping omitted
 * @returns `BookingWidgetQuote` or `null` when slot is missing, sold out, has zero
 *   guests, category mapping is incomplete, or a tier band cannot be resolved
 */
export function calculateBookingQuote(
  availabilities: readonly BokunAvailability[],
  date: string,
  startTimeId: number,
  participants: BookingWidgetParticipants,
  defaultRateId: number,
  options?: CalculateBookingQuoteOptions,
): BookingWidgetQuote | null {
  if (sumParticipants(participants) === 0) {
    return null;
  }

  const slot = findAvailabilitySlot(availabilities, date, startTimeId);
  if (!slot || slot.soldOut || slot.unavailable) {
    return null;
  }

  const categoryMapping = resolveCategoryMapping(options);
  if (!categoryMapping) {
    return null;
  }

  const priceByRate = pickPriceByRate(slot, defaultRateId);
  if (!priceByRate) {
    return null;
  }

  const breakdown: BookingWidgetQuoteLineItem[] = [];

  for (const field of WIDGET_PARTICIPANT_FIELDS) {
    const count = participants[field];
    if (count <= 0) {
      continue;
    }

    const categoryId = categoryMapping[field];
    const band = pickUnitPriceBand(
      priceByRate.pricePerCategoryUnit,
      categoryId,
      count,
    );

    if (!band) {
      return null;
    }

    const unitAmount = band.amount.amount;
    breakdown.push({
      categoryId,
      categoryLabel: resolveCategoryLabel(
        field,
        categoryId,
        options?.pricingCategories,
      ),
      count,
      unitAmount,
      lineTotal: count * unitAmount,
      currency: band.amount.currency,
    });
  }

  if (breakdown.length === 0) {
    return null;
  }

  const currency = breakdown[0]!.currency;
  const totalAmount = breakdown.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    totalAmount,
    currency,
    breakdown,
    source: "bokun-availability",
  };
}
