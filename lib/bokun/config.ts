/**
 * Bokun API Configuration
 * Handles environment-based configuration and API endpoints
 */

import { config } from "@/lib/config";

// Configuration type for Bokun API
export interface BokunConfig {
  accessKey: string;
  secretKey: string;
  domain: string;
}

// Environment-based configuration using centralized config
export const bokunConfig: BokunConfig = {
  accessKey: config.bokun.accessKey,
  secretKey: config.bokun.secretKey,
  domain: config.bokun.domain,
};

// API endpoints
export const BOKUN_ENDPOINTS = {
  SEARCH: "/activity.json/search",
  PRODUCT_BY_ID: (id: string) => `/activity.json/${id}`,
  PRODUCT_BY_SLUG: (slug: string) => `/activity.json/slug/${slug}`,
  PICKUP_PLACES: (id: string) => `/activity.json/${id}/pickup-places`,
} as const;
