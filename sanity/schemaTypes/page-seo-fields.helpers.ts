/**
 * page-seo-fields.helpers — pure helpers for shared page SEO Sanity fields.
 *
 * Used by `page-seo-fields.ts` and the social share image field so marketing
 * pages (home, explore, contact, and future pages) share one SEO fieldset.
 */

import { validateOptionalNonBlankString } from "./place-seo-fields.helpers";

export { validateOptionalNonBlankString };

/** Studio fieldset name assigned to every shared page SEO field. */
export const PAGE_SEO_FIELDSET_NAME = "seo";

/** Options for the collapsible SEO fieldset on page documents. */
export type PageSeoFieldsetOptions = {
  /**
   * When true, the SEO group starts collapsed in Studio.
   * Defaults to false for page documents (SEO is the primary content).
   */
  collapsed?: boolean;
};

/** Resolved SEO fieldset options after applying defaults. */
export type ResolvedPageSeoFieldsetOptions = {
  name: typeof PAGE_SEO_FIELDSET_NAME;
  title: string;
  collapsible: true;
  collapsed: boolean;
};

/**
 * Builds Studio fieldset options for the shared page SEO group.
 *
 * @param options - Optional collapse default (`collapsed` defaults to false)
 * @returns Fieldset identity + collapsible options for document `fieldsets`
 */
export function resolvePageSeoFieldsetOptions(
  options?: PageSeoFieldsetOptions,
): ResolvedPageSeoFieldsetOptions {
  return {
    name: PAGE_SEO_FIELDSET_NAME,
    title: "SEO",
    collapsible: true,
    collapsed: options?.collapsed ?? false,
  };
}
