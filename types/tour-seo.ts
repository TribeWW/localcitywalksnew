/**
 * Published Tour SEO overrides loaded from Sanity for a single Bokun product page.
 *
 * Title/description/keyword fields are optional in Studio; callers merge with code
 * fallbacks when empty. GEO fields (`aiSummary`, `sameAsUrl`, `faq`) feed JSON-LD.
 */

/** One FAQ Q&A row from `tourSeoMetadata.faq`. */
export type TourSeoFaqItem = {
  _key?: string;
  question?: string | null;
  answer?: string | null;
};

export type TourSeoMetadata = {
  seoTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  aiSummary?: string | null;
  sameAsUrl?: string | null;
  faq?: TourSeoFaqItem[] | null;
};
