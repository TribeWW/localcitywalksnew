/**
 * place-seo-fields.helpers — pure helpers for shared place/tour SEO Sanity fields.
 *
 * Used by `place-seo-fields.ts` (field definitions) and unit-tested for option
 * defaults, optional-string validation, variant-specific copy, and SEO fieldset.
 */

/** Studio fieldset name assigned to every shared SEO field. */
export const PLACE_SEO_FIELDSET_NAME = "seo";

/** Options for the collapsible SEO fieldset on place/tour documents. */
export type PlaceSeoFieldsetOptions = {
  /**
   * When true, the SEO group starts collapsed in Studio.
   * Defaults to true (places); tour SEO docs typically pass false.
   */
  collapsed?: boolean;
};

/** Resolved SEO fieldset options after applying defaults. */
export type ResolvedPlaceSeoFieldsetOptions = {
  name: typeof PLACE_SEO_FIELDSET_NAME;
  title: string;
  collapsible: true;
  collapsed: boolean;
};

/**
 * Builds Studio fieldset options for the shared SEO group.
 *
 * @param options - Optional collapse default (`collapsed` defaults to true)
 * @returns Fieldset identity + collapsible options for document `fieldsets`
 */
export function resolvePlaceSeoFieldsetOptions(
  options?: PlaceSeoFieldsetOptions,
): ResolvedPlaceSeoFieldsetOptions {
  return {
    name: PLACE_SEO_FIELDSET_NAME,
    title: "SEO",
    collapsible: true,
    collapsed: options?.collapsed ?? true,
  };
}

/** Whether SEO field descriptions target a place document or a tour document. */
export type PlaceSeoVariant = "place" | "tour";

/** Options for building shared SEO fields on place or tour documents. */
export type PlaceSeoFieldOptions = {
  /**
   * When true, FAQ must have at least {@link PLACE_SEO_FAQ_MIN_WHEN_REQUIRED} items.
   * Defaults to false (optional FAQ on city/country/region).
   */
  faqRequired?: boolean;
  /**
   * Copy variant for AI summary / FAQ / sameAs descriptions.
   * Defaults to `"place"`.
   */
  variant?: PlaceSeoVariant;
};

/** Resolved options after applying defaults. */
export type ResolvedPlaceSeoFieldOptions = {
  faqRequired: boolean;
  variant: PlaceSeoVariant;
};

/** Minimum FAQ items when `faqRequired` is true (matches tour SEO). */
export const PLACE_SEO_FAQ_MIN_WHEN_REQUIRED = 2;

/** Variant-specific descriptions for SEO fields that differ by document type. */
export type PlaceSeoCopy = {
  aiSummary: string;
  faq: string;
  sameAsUrl: string;
};

const PLACE_COPY: PlaceSeoCopy = {
  aiSummary:
    "Plain-language factual summary for AI citation about this place. No marketing language.",
  faq: "Place-specific Q&A for structured data and AI citation. Keep answers factual.",
  sameAsUrl:
    "Wikidata or Wikipedia link for this place. Used for entity disambiguation in structured data (schema.org sameAs).",
};

const TOUR_COPY: PlaceSeoCopy = {
  aiSummary:
    "Plain-language factual summary for AI citation: tour type, city, duration, group size, what's included. No marketing language.",
  faq: "Tour-specific Q&A (e.g. duration, meeting point). Do not copy the generic on-page FAQ block used across all tours.",
  sameAsUrl:
    "Wikidata or Wikipedia link for the city/landmark this tour centers on. Used for entity disambiguation in structured data (schema.org sameAs). Tour-specific — not used on /explore.",
};

/**
 * Applies defaults for shared SEO field options.
 *
 * @param options - Partial options from the schema caller
 * @returns Fully resolved options (`faqRequired` false, `variant` place by default)
 */
export function resolvePlaceSeoFieldOptions(
  options?: PlaceSeoFieldOptions,
): ResolvedPlaceSeoFieldOptions {
  return {
    faqRequired: options?.faqRequired ?? false,
    variant: options?.variant ?? "place",
  };
}

/**
 * Validates an optional string field: empty/null is allowed; whitespace-only is not.
 *
 * @param value - Candidate field value from Studio
 * @param blankMessage - Error message when the value is a blank string
 * @returns `true` when valid, otherwise `blankMessage`
 */
export function validateOptionalNonBlankString(
  value: unknown,
  blankMessage: string,
): true | string {
  if (value == null || (typeof value === "string" && value.trim() !== "")) {
    return true;
  }
  return blankMessage;
}

/**
 * Returns field description copy for the given SEO variant.
 *
 * @param variant - `"place"` for city/country/region, `"tour"` for tour SEO
 */
export function getPlaceSeoCopy(variant: PlaceSeoVariant): PlaceSeoCopy {
  return variant === "tour" ? TOUR_COPY : PLACE_COPY;
}
