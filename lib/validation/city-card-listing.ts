/**
 * Runtime schema for client-submitted listing cards (`enrichCityCardsForListingAction`).
 *
 * Parses a clean `CityCardData` so unknown keys and malformed optional fields
 * (e.g. `displayPriceCurrency`) never reach enrichment or `display.ts`.
 */

import { z } from "zod";

import type { CityCardData } from "@/types/bokun";

/** Optional string: empty / whitespace becomes `undefined`. */
const optionalCardString = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().min(1).optional());

/**
 * Single listing card from the client. Unknown keys are stripped.
 * Optional display fields are type-checked when present.
 */
export const cityCardListingInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  image: z.string().trim().min(1),
  countryCode: optionalCardString,
  country: optionalCardString,
  cityName: optionalCardString,
  citySlug: optionalCardString,
  slug: optionalCardString,
  displayPricePerPerson: z.number().finite().nonnegative().optional(),
  displayPriceCurrency: optionalCardString,
  ratingLabel: optionalCardString,
  showRating: z.boolean().optional(),
  defaultRateId: z.number().int().positive().optional(),
});

export type CityCardListingInput = z.infer<typeof cityCardListingInputSchema>;

/**
 * Formats the first Zod issue into the listing-action error style.
 */
export function formatCityCardListingParseError(
  index: number,
  error: z.ZodError,
): string {
  const path = error.issues[0]?.path[0];

  if (path === "id" || path === "title" || path === "image") {
    return `Invalid listing card ${String(path)} at index ${index}`;
  }

  if (typeof path === "string" && path.length > 0) {
    return `Invalid listing card ${path} at index ${index}`;
  }

  return `Invalid listing card at index ${index}`;
}

/**
 * Parses one client card into a clean {@link CityCardData} (no passthrough keys).
 */
export function parseCityCardListingInput(
  card: unknown,
  index: number,
): CityCardData {
  const parsed = cityCardListingInputSchema.safeParse(card);

  if (!parsed.success) {
    throw new Error(formatCityCardListingParseError(index, parsed.error));
  }

  return parsed.data;
}
