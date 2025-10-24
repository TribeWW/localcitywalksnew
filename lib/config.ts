/**
 * Centralized Configuration Management
 * Validates and provides type-safe access to all environment variables
 */

interface AppConfig {
  bokun: {
    accessKey: string;
    secretKey: string;
    domain: string;
  };
  email: {
    supportEmail: string;
    supportPassword: string;
  };
  analytics: {
    ga4Id?: string; // Optional for development
    gtmId?: string; // Optional for development
  };
}

/**
 * Validates that a required environment variable exists
 * @param name - The environment variable name
 * @param value - The environment variable value
 * @returns The validated value
 * @throws Error if the variable is missing
 */
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Centralized application configuration
 * Validates all required environment variables at startup
 */
export const config: AppConfig = {
  bokun: {
    accessKey: validateEnvVar("BOKUN_ACCESS_KEY", process.env.BOKUN_ACCESS_KEY),
    secretKey: validateEnvVar("BOKUN_SECRET_KEY", process.env.BOKUN_SECRET_KEY),
    domain: validateEnvVar("BOKUN_DOMAIN", process.env.BOKUN_DOMAIN),
  },
  email: {
    supportEmail: validateEnvVar("SUPPORT_EMAIL", process.env.SUPPORT_EMAIL),
    supportPassword: validateEnvVar(
      "SUPPORT_PASSWORD",
      process.env.SUPPORT_PASSWORD
    ),
  },
  analytics: {
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  },
};

// Re-export for backward compatibility
export type { AppConfig };
