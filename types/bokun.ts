/**
 * Bokun API TypeScript Interfaces
 * Based on actual API response structure from /activity.json/search endpoint
 */

/**
 * Minimal response structure from Bokun search API
 * Only includes fields we actually use
 */
export interface BokunSearchResponse {
  items: BokunProduct[];
  totalHits?: number;
}

/**
 * Full googlePlace structure from Bokun (used for city/country sync)
 */
export interface BokunGooglePlace {
  country: string;
  countryCode: string; // ISO2
  city: string;
  cityCode: string; // Unique identifier
}

/**
 * Minimal product structure for city cards and search items
 * Matches Bokun search response (ExamplePayloadSearch.json). No slug in search; use id for URL.
 */
export interface BokunProduct {
  id: string;
  title: string;
  keyPhoto: BokunPhoto;
  googlePlace?: BokunGooglePlace;
  /** HTML description (search returns this) */
  summary?: string;
  /** Short plain-text blurb (search returns this) */
  excerpt?: string;
}

/**
 * Minimal photo structure for keyPhoto
 * Only includes fields we actually use
 */
export interface BokunPhoto {
  derived: Array<{
    name: string; // "thumbnail", "preview", "large"
    url: string;
  }>;
}

/**
 * Simplified data structure for CityCard component and tour page links
 * URL = /tours/{citySlug}/{slug}. Slug is generated: slugify(title) + "-" + id (e.g. "hello-toledo-private-walk-1077682").
 */
export interface CityCardData {
  id: string;
  title: string;
  image: string;
  countryCode?: string;
  country?: string;
  /** Slugified googlePlace.city for /tours/{city}/{slug} (e.g. "toledo", "aix-en-provence") */
  citySlug?: string;
  /** Generated slug for URL segment: slugify(title) + "-" + id (e.g. "hello-toledo-private-walk-1077682") */
  slug?: string;
}

/**
 * Server action response type
 */
export interface GetAllProductsResult {
  success: boolean;
  data?: CityCardData[];
  error?: string;
  totalHits?: number;
}

/**
 * Server action response type for paginated product fetch (one page)
 */
export interface GetProductsPageResult {
  success: boolean;
  data?: CityCardData[];
  totalHits?: number;
  error?: string;
}

/**
 * Product detail from GET /activity.json/{id} (single-product endpoint).
 * Used for the tour page; shape aligned with search item + full description/photos.
 *
 * Bokun typically returns long-form HTML as `summary`; some payloads may expose `description` instead.
 */
export interface BokunProductDetail {
  id: string;
  /** Product title from Bokun */
  title: string;
  /** Long-form HTML body (Bokun REST often uses `summary` for this) */
  description?: string | null;
  summary?: string;
  /** Short plain-text intro / teaser */
  excerpt?: string;
  keyPhoto: BokunPhoto;
  photos?: BokunPhoto[];
  googlePlace?: BokunGooglePlace;
}

/**
 * Server action response type for single-product (tour detail) fetch
 */
export interface GetTourDetailResult {
  success: boolean;
  data?: BokunProductDetail;
  error?: string;
}

/**
 * Sanity country document structure
 */
export interface CountryDocument {
  _id: string;
  _type: "country";
  name: string;
  iso2: string;
  slug?: string;
}

/**
 * Sanity city document structure (with country support)
 */
export interface CityDocument {
  _id: string;
  _type: "city";
  name: string;
  cityCode: string;
  country: {
    _type: "reference";
    _ref: string;
  };
  countryCode: string;
}

/**
 * Result of syncing cities and countries from Bokun products to Sanity
 */
export interface CitySyncResult {
  countries: {
    created: string[]; // Array of country codes created
    updated: string[]; // Array of country codes updated
  };
  cities: {
    created: string[]; // Array of city codes created
    updated: string[]; // Array of city codes updated
    existing: string[]; // Array of city codes that already existed
  };
  errors: Array<{
    type: "country" | "city";
    identifier: string; // countryCode or cityCode
    error: string;
  }>;
}
