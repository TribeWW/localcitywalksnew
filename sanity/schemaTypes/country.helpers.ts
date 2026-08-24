/**
 * country.helpers — pure helpers for the Country Sanity document schema.
 *
 * Extracted for unit testing and reuse by `country.ts` (featured-on-explore cap)
 * and `FeaturedOnExploreInput` (slot usage label in Studio).
 */

import type { ValidationContext } from "sanity";
import { apiVersion } from "../env";

/** Maximum published countries that may have `featuredOnExplore` enabled. */
export const FEATURED_EXPLORE_MAX = 5;

/** Studio error when enabling featured would exceed {@link FEATURED_EXPLORE_MAX}. */
export const FEATURED_ON_EXPLORE_CAP_MESSAGE =
  "Only 5 countries can be featured on explore. Turn one off first.";

/**
 * GROQ: count of *other* published countries already featured on explore.
 *
 * Excludes drafts and the current document's published id (`$publishedId`).
 */
export const FEATURED_EXPLORE_OTHER_COUNT_QUERY = `count(*[_type == "country" && featuredOnExplore == true && !(_id in path("drafts.**")) && _id != $publishedId])`;

/**
 * GROQ: count of all published countries featured on explore (for Studio slot UI).
 */
export const FEATURED_EXPLORE_TOTAL_COUNT_QUERY = `count(*[_type == "country" && featuredOnExplore == true && !(_id in path("drafts.**"))])`;

/**
 * Strips a leading `drafts.` prefix from a Sanity document `_id`.
 *
 * @param rawId - Document id from Studio (published or draft form)
 * @returns The published id without the draft prefix
 */
export function toPublishedCountryId(rawId: string): string {
  return rawId.replace(/^drafts\./, "");
}

/**
 * Builds the Studio label showing how many featured explore slots are used.
 *
 * Remaining is clamped at zero when `used` exceeds `max` (e.g. legacy data).
 *
 * @param used - Count of published countries with `featuredOnExplore == true`
 * @param max - Slot capacity (normally {@link FEATURED_EXPLORE_MAX})
 * @returns Human-readable slot usage string for editors
 */
export function formatFeaturedExploreSlotsLabel(
  used: number,
  max: number,
): string {
  const remaining = Math.max(0, max - used);
  return `Featured slots: ${used} of ${max} used (${remaining} remaining)`;
}

/**
 * Validates that enabling `featuredOnExplore` does not exceed the published cap.
 *
 * Skips the GROQ lookup when the value is not `true` or the document has no `_id`.
 * Counts only other published featured countries (drafts excluded; current id stripped).
 *
 * @param value - Field value from Studio (`true` when the editor enables the flag)
 * @param context - Sanity validation context with document and API client
 * @returns `true` when valid, or {@link FEATURED_ON_EXPLORE_CAP_MESSAGE} when at cap
 */
export async function validateFeaturedOnExploreCap(
  value: unknown,
  context: ValidationContext,
): Promise<true | string> {
  if (value !== true) {
    return true;
  }

  const rawId = context.document?._id;
  if (typeof rawId !== "string" || rawId.length === 0) {
    return true;
  }

  const publishedId = toPublishedCountryId(rawId);
  const client = context.getClient({ apiVersion });

  try {
    const otherFeaturedCount = await client.fetch<number>(
      FEATURED_EXPLORE_OTHER_COUNT_QUERY,
      { publishedId },
    );

    return otherFeaturedCount < FEATURED_EXPLORE_MAX
      ? true
      : FEATURED_ON_EXPLORE_CAP_MESSAGE;
  } catch {
    return "Could not verify featured-on-explore capacity. Please try again.";
  }
}
