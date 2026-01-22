"use server";

import { client } from "@/sanity/lib/client";
import { BokunProduct } from "@/types/bokun";

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
export function normalizeCityName(name: string | null | undefined): string {
  // Handle null or undefined
  if (!name) {
    return '';
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
export function extractUniqueCities(products: BokunProduct[]): string[] {
  // Extract and normalize all city names
  const normalizedCities = products
    .map((product) => normalizeCityName(product.googlePlace?.city))
    .filter((city) => city !== ''); // Remove invalid cities

  // Use Set to get unique cities only
  const uniqueCities = Array.from(new Set(normalizedCities));

  return uniqueCities;
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
  cityNames: string[]
): Promise<string[]> {
  // Early return if no cities to check
  if (cityNames.length === 0) {
    return [];
  }

  try {
    // Single GROQ query to find all existing cities at once
    // This is more efficient than querying each city individually
    const existingCities = await client.fetch<
      Array<{ name: string }>
    >(
      `*[_type == "city" && name in $cityNames]{name}`,
      { cityNames },
      { next: { revalidate: 0 } } // Always fetch fresh data for existence check
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
