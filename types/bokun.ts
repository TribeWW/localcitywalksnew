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
 * Minimal product structure for city cards
 * Only includes fields we actually use
 */
export interface BokunProduct {
  id: string;
  title: string;
  keyPhoto: BokunPhoto;
  googlePlace: {
    city: string;
  };
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
 * Result of syncing cities from Bokun products to Sanity
 */
export interface CitySyncResult {
  /** Array of city names that were successfully created in Sanity */
  created: string[];
  /** Array of city names that already existed in Sanity */
  existing: string[];
  /** Array of cities that failed to create, with error details */
  errors: Array<{
    city: string;
    error: string;
  }>;
}

/**
 * Sanity city document structure
 */
export interface CityDocument {
  _id: string;
  _type: 'city';
  name: string;
}

/**
 * Result of syncing cities from Bokun products to Sanity
 */
export interface CitySyncResult {
  /** Array of city names that were successfully created in Sanity */
  created: string[];
  /** Array of city names that already existed in Sanity */
  existing: string[];
  /** Array of cities that failed to create, with error details */
  errors: Array<{
    city: string;
    error: string;
  }>;
}

/**
 * Sanity city document structure
 */
export interface CityDocument {
  _id: string;
  _type: 'city';
  name: string;
}
