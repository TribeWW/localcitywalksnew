/**
 * Bokun API Configuration
 * Handles environment-based configuration and API endpoints
 */

// Configuration type for Bokun API
export interface BokunConfig {
  accessKey: string;
  secretKey: string;
  domain: string;
}

// Environment-based configuration
export const bokunConfig: BokunConfig = {
  accessKey: process.env.BOKUN_ACCESS_KEY!,
  secretKey: process.env.BOKUN_SECRET_KEY!,
  domain: process.env.BOKUN_DOMAIN!,
};

// API endpoints
export const BOKUN_ENDPOINTS = {
  SEARCH: "/activity.json/search",
  PRODUCT_BY_ID: (id: string) => `/activity.json/${id}`,
  PRODUCT_BY_SLUG: (slug: string) => `/activity.json/slug/${slug}`,
  PICKUP_PLACES: (id: string) => `/activity.json/${id}/pickup-places`,
} as const;
