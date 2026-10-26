/** Default max reviews returned per query (GROQ slice uses exclusive end index). */
export const DEFAULT_REVIEW_LIMIT = 10;

/** Row shape returned by public review GROQ projections (no platform, no system timestamps). */
export type SanityReviewListItem = {
  _id: string;
  tourId: string;
  rating: number;
  experienceDate: string;
  authorName: string;
  body: string | null;
};

/**
 * Home carousel row. City fields come from a unique published city match
 * and are not stored on the review document.
 */
export type HomeReviewListItem = SanityReviewListItem & {
  cityName: string;
  countryName: string;
  cityHref: string;
};
