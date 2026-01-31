"use server";

import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { BokunProduct, CitySyncResult } from "@/types/bokun";

/**
 * City sync actions for Sanity
 *
 * This file contains functions for syncing cities from Bokun products to Sanity.
 */

/**
 * Normalizes a city name for consistent storage in Sanity
 *
 * Handles edge cases:
 * - Trims leading and trailing whitespace
 * - Handles null and undefined inputs
 * - Returns empty string for invalid input (allows easy filtering)
 * - Preserves proper city name capitalization
 *
 * @param name - City name from Bokun API (may have whitespace, null, undefined)
 * @returns Normalized city name (trimmed) or empty string if invalid
 *
 * @example
 * normalizeCityName("  Madrid  ") // Returns "Madrid"
 * normalizeCityName(null) // Returns ""
 * normalizeCityName(undefined) // Returns ""
 * normalizeCityName("") // Returns ""
 * normalizeCityName("Paris") // Returns "Paris"
 */
export async function normalizeCityName(
  name: string | null | undefined,
): Promise<string> {
  // Handle null or undefined
  if (!name) {
    return "";
  }

  // Trim leading and trailing whitespace
  const trimmed = name.trim();

  // Return empty string if result is empty (allows filtering out invalid cities)
  return trimmed;
}

/**
 * Extracts unique city names from Bokun products
 *
 * Processes products to:
 * - Extract city names from googlePlace.city
 * - Normalize each city name (trim whitespace, handle nulls)
 * - Filter out invalid cities (empty strings)
 * - Deduplicate to get unique cities only
 *
 * @param products - Array of Bokun products
 * @returns Array of unique, normalized city names
 *
 * @example
 * extractUniqueCities([
 *   { googlePlace: { city: "  Madrid  " } },
 *   { googlePlace: { city: "Paris" } },
 *   { googlePlace: { city: "Madrid" } } // Duplicate
 * ]) // Returns ["Madrid", "Paris"]
 */
export async function extractUniqueCities(
  products: BokunProduct[],
): Promise<string[]> {
  // Extract and normalize all city names
  const normalizedCitiesPromises = products.map((product) =>
    normalizeCityName(product.googlePlace?.city),
  );
  const normalizedCities = await Promise.all(normalizedCitiesPromises);
  const validCities = normalizedCities.filter((city) => city !== ""); // Remove invalid cities

  // Use Set to get unique cities only
  const uniqueCities = Array.from(new Set(validCities));

  return uniqueCities;
}

/** Country data extracted from Bokun products for sync */
export type CountryFromProduct = { countryCode: string; name: string };

const ISO2_REGEX = /^[A-Z]{2}$/;

/**
 * Extracts unique countries from Bokun products
 *
 * Processes products to:
 * - Extract country code and name from googlePlace
 * - Normalize country code (trim, uppercase, validate ISO2)
 * - Filter out invalid or missing country data
 * - Deduplicate by country code (one entry per country)
 *
 * @param products - Array of Bokun products
 * @returns Array of unique country objects with countryCode and name
 *
 * @example
 * extractUniqueCountries([
 *   { googlePlace: { country: "France", countryCode: "FR", city: "Paris", cityCode: "Paris" } },
 *   { googlePlace: { country: "Spain", countryCode: "ES", city: "Madrid", cityCode: "Madrid" } },
 *   { googlePlace: { country: "France", countryCode: "fr", city: "Lyon", cityCode: "Lyon" } }, // Normalized to FR, deduplicated
 * ]) // Returns [{ countryCode: "FR", name: "France" }, { countryCode: "ES", name: "Spain" }]
 */
export async function extractUniqueCountries(
  products: BokunProduct[],
): Promise<CountryFromProduct[]> {
  const byCode = new Map<string, CountryFromProduct>();

  for (const product of products) {
    const gp = product.googlePlace;
    if (!gp?.countryCode || !gp?.country) continue;

    const rawCode = gp.countryCode.trim().toUpperCase();
    if (rawCode.length !== 2 || !ISO2_REGEX.test(rawCode)) continue;

    const name = gp.country.trim();
    if (!name) continue;

    if (!byCode.has(rawCode)) {
      byCode.set(rawCode, { countryCode: rawCode, name });
    }
  }

  return Array.from(byCode.values());
}

/**
 * Queries Sanity to find which cities already exist
 *
 * Uses a single GROQ query to efficiently check existence of multiple cities.
 * Uses the read client (cached) for faster performance.
 *
 * @param cityNames - Array of normalized city names to check
 * @returns Promise resolving to array of city names that exist in Sanity
 *
 * @example
 * await getExistingCities(["Madrid", "Paris", "Barcelona"])
 * // Returns ["Madrid", "Paris"] if Barcelona doesn't exist
 */
export async function getExistingCities(
  cityNames: string[],
): Promise<string[]> {
  // Early return if no cities to check
  if (cityNames.length === 0) {
    return [];
  }

  try {
    // Single GROQ query to find all existing cities at once
    // This is more efficient than querying each city individually
    const existingCities = await client.fetch<Array<{ name: string }>>(
      `*[_type == "city" && name in $cityNames]{name}`,
      { cityNames },
      { next: { revalidate: 0 } }, // Always fetch fresh data for existence check
    );

    // Extract just the city names from the results
    return existingCities.map((city) => city.name);
  } catch (error) {
    // Log error but return empty array to allow sync to continue
    // This prevents a single query failure from breaking the entire sync
    console.error("Error querying existing cities from Sanity:", error);
    return [];
  }
}

/**
 * Generates a deterministic document ID for a city based on its name
 *
 * Converts city name to a URL-friendly slug format:
 * - Lowercases the name
 * - Replaces spaces and special characters with hyphens
 * - Prefixes with "city-" to ensure uniqueness
 *
 * @param cityName - Normalized city name
 * @returns Deterministic document ID (e.g., "city-madrid", "city-new-york")
 *
 * @example
 * generateCityId("Madrid") // Returns "city-madrid"
 * generateCityId("New York") // Returns "city-new-york"
 * generateCityId("São Paulo") // Returns "city-s-o-paulo"
 */
function generateCityId(cityName: string): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const slug = cityName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Prefix with "city-" to ensure uniqueness and clarity
  return `city-${slug}`;
}

/**
 * Generates a deterministic document ID for a country based on its ISO2 code
 *
 * @param countryCode - ISO2 country code (e.g. FR, ES)
 * @returns Deterministic document ID (e.g. "country-fr", "country-es")
 */
function generateCountryId(countryCode: string): string {
  return `country-${countryCode.toLowerCase()}`;
}

/** Result of syncing countries to Sanity (used by syncCountries) */
export type CountrySyncResult = {
  created: string[];
  updated: string[];
  errors: Array<{ type: "country"; identifier: string; error: string }>;
};

/**
 * Creates or ensures country documents exist in Sanity
 *
 * Uses createIfNotExists for each country. Idempotent and safe to call multiple times.
 * Collects created country codes and errors; "updated" is left empty (createIfNotExists
 * does not distinguish create vs existing).
 *
 * @param countries - Array of country data from extractUniqueCountries()
 * @returns Promise with created country codes, updated (empty), and errors
 */
export async function syncCountries(
  countries: CountryFromProduct[],
): Promise<CountrySyncResult> {
  const result: CountrySyncResult = {
    created: [],
    updated: [],
    errors: [],
  };

  if (countries.length === 0) return result;

  for (const { countryCode, name } of countries) {
    try {
      const _id = generateCountryId(countryCode);
      await writeClient.createIfNotExists({
        _id,
        _type: "country",
        name,
        iso2: countryCode,
      });
      result.created.push(countryCode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push({
        type: "country",
        identifier: countryCode,
        error: errorMessage,
      });
      console.error(
        `Failed to create country "${countryCode}" in Sanity:`,
        error,
      );
    }
  }

  return result;
}

/**
 * Creates cities in Sanity that don't already exist
 *
 * Uses `createIfNotExists` to ensure idempotency - safe to call multiple times.
 * Each city gets a deterministic ID based on its name (slug format).
 *
 * @param cityNames - Array of normalized city names to create
 * @returns Promise resolving to CitySyncResult with created, existing, and errors
 *
 * @example
 * await createCities(["Madrid", "Barcelona"])
 * // Returns: { created: ["Madrid", "Barcelona"], existing: [], errors: [] }
 */
function emptyCitySyncResult(): CitySyncResult {
  return {
    countries: { created: [], updated: [] },
    cities: { created: [], updated: [], existing: [] },
    errors: [],
  };
}

export async function createCities(
  cityNames: string[],
): Promise<CitySyncResult> {
  const result = emptyCitySyncResult();

  // Early return if no cities to create
  if (cityNames.length === 0) {
    return result;
  }

  // Process each city individually to handle errors gracefully
  // This ensures one failure doesn't stop the entire batch
  for (const cityName of cityNames) {
    try {
      const cityId = generateCityId(cityName);

      // createIfNotExists will create the document if it doesn't exist,
      // or silently succeed if it already exists (idempotent operation)
      await writeClient.createIfNotExists({
        _id: cityId,
        _type: "city",
        name: cityName,
      });

      // Since we check existence before calling this function (in sync flow),
      // successful calls are assumed to be new creations
      // If a document already existed, createIfNotExists succeeds silently,
      // but we've already filtered those out in the sync process
      result.cities.created.push(cityName);
    } catch (error) {
      // Collect error but continue processing other cities
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push({
        type: "city",
        identifier: cityName,
        error: errorMessage,
      });

      console.error(`Failed to create city "${cityName}" in Sanity:`, error);
    }
  }

  return result;
}

/**
 * Main sync function that orchestrates the complete city sync process
 *
 * This function:
 * 1. Extracts unique cities from Bokun products
 * 2. Checks which cities already exist in Sanity
 * 3. Creates missing cities in Sanity
 * 4. Returns comprehensive sync results
 *
 * @param products - Array of Bokun products from the API
 * @returns Promise resolving to CitySyncResult with sync details
 *
 * @example
 * const result = await syncCitiesFromProducts(bokunProducts);
 * // result: { created: ["Barcelona"], existing: ["Madrid", "Paris"], errors: [] }
 */
export async function syncCitiesFromProducts(
  products: BokunProduct[],
): Promise<CitySyncResult> {
  try {
    // Step 1: Extract unique, normalized city names from products
    const allCities = await extractUniqueCities(products);

    // Early return if no cities found
    if (allCities.length === 0) {
      return emptyCitySyncResult();
    }

    // Step 2: Check which cities already exist in Sanity
    const existingCities = await getExistingCities(allCities);

    // Step 3: Filter out existing cities to get only new ones
    const citiesToCreate = allCities.filter(
      (city) => !existingCities.includes(city),
    );

    // Step 4: Create missing cities
    const createResult = await createCities(citiesToCreate);

    // Step 5: Combine results (new CitySyncResult shape)
    return {
      countries: createResult.countries,
      cities: {
        created: createResult.cities.created,
        updated: createResult.cities.updated,
        existing: existingCities,
      },
      errors: createResult.errors,
    };
  } catch (error) {
    // If sync fails completely, return error result
    // This allows the calling function to log and continue
    console.error("City sync failed:", error);
    return {
      ...emptyCitySyncResult(),
      errors: [
        {
          type: "city" as const,
          identifier: "SYNC_ERROR",
          error: error instanceof Error ? error.message : "Unknown sync error",
        },
      ],
    };
  }
}
