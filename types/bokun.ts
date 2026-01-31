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
 * Minimal product structure for city cards
 * Only includes fields we actually use
 */
export interface BokunProduct {
  id: string;
  title: string;
  keyPhoto: BokunPhoto;
  googlePlace?: BokunGooglePlace;
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
 * Simplified data structure for CityCard component
 * Transformed from BokunProduct for easier component usage
 */
export interface CityCardData {
  id: string;
  title: string;
  image: string;
}

/**
 * Server action response type
 */
export interface GetAllProductsResult {
  success: boolean;
  data?: CityCardData[];
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
