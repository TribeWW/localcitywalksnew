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
  city: string;
  keyPhoto: BokunPhoto;
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
