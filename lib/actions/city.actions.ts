"use server";

import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { stripAccents } from "@/lib/utils";
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
  name: string | null | undefined
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
 * Extracts unique cities with country context from Bokun products
 *
 * Processes products to:
 * - Extract city name, cityCode, and countryCode from googlePlace
 * - Normalize (trim, validate countryCode as ISO2)
 * - Filter out invalid or missing data
 * - Deduplicate by cityCode (one entry per city)
 *
 * @param products - Array of Bokun products
 * @returns Array of unique city objects with cityCode, name, and countryCode
 *
 * @example
 * extractUniqueCities([
 *   { googlePlace: { city: "Madrid", cityCode: "Madrid", countryCode: "ES", country: "Spain" } },
 *   { googlePlace: { city: "Biarritz", cityCode: "Biarritz", countryCode: "FR", country: "France" } },
 *   { googlePlace: { city: "Madrid", cityCode: "Madrid", countryCode: "es", country: "Spain" } }, // Deduplicated by cityCode
 * ]) // Returns [{ cityCode: "Madrid", name: "Madrid", countryCode: "ES" }, { cityCode: "Biarritz", name: "Biarritz", countryCode: "FR" }]
 */
export async function extractUniqueCities(
  products: BokunProduct[]
): Promise<CityFromProduct[]> {
  const byCityCode = new Map<string, CityFromProduct>();

  for (const product of products) {
    const gp = product.googlePlace;
    if (!gp?.city || !gp?.countryCode) continue;

    const name = gp.city.trim();
    if (!name) continue;

    const rawCountryCode = gp.countryCode.trim().toUpperCase();
    if (rawCountryCode.length !== 2 || !ISO2_REGEX.test(rawCountryCode))
      continue;

    // Use cityCode from Bokun when present and valid (no spaces); otherwise derive from city name
    let cityCode: string;
    const rawFromBokun = gp.cityCode?.trim();
    if (rawFromBokun && rawFromBokun !== "" && !/\s/.test(rawFromBokun)) {
      cityCode = normalizeCityCodeForSlug(rawFromBokun);
    } else {
      cityCode = normalizeCityCodeForSlug(name);
    }
    if (!cityCode) continue;

    const dedupeKey = cityCode.toLowerCase();
    if (!byCityCode.has(dedupeKey)) {
      byCityCode.set(dedupeKey, {
        cityCode,
        name,
        countryCode: rawCountryCode,
      });
    }
  }

  return Array.from(byCityCode.values());
}

/** Country data extracted from Bokun products for sync */
export type CountryFromProduct = { countryCode: string; name: string };

/** City data with country context extracted from Bokun products for sync */
export type CityFromProduct = {
  cityCode: string;
  name: string;
  countryCode: string;
};

const ISO2_REGEX = /^[A-Z]{2}$/;

/**
 * Normalizes city code for storage and slugs: trim, accents removed, words joined with a single dash.
 * e.g. "A Coruña" → "a-coruna", "Biarritz" → "biarritz". Not used for display names.
 */
function normalizeCityCodeForSlug(raw: string): string {
  const trimmed = raw.trim();
  const noAccents = stripAccents(trimmed);
  const dashed = noAccents.replace(/\s+/g, "-").replace(/-+/g, "-"); // spaces → dash, collapse multiple dashes
  return dashed.toLowerCase();
}

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
  products: BokunProduct[]
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

/** Sanity city document fields needed for migration (cities without country) */
type CityWithoutCountry = {
  _id: string;
  name?: string | null;
  cityCode?: string | null;
};

/**
 * Queries Sanity for city documents that have no country reference (legacy/migration).
 * Used to patch them with country, cityCode, and countryCode from Bokun data.
 */
async function getCitiesWithoutCountry(): Promise<CityWithoutCountry[]> {
  try {
    const list = await client.fetch<CityWithoutCountry[]>(
      `*[_type == "city" && !defined(country)]{ _id, name, cityCode }`,
      {},
      { next: { revalidate: 0 } }
    );
    return list ?? [];
  } catch (error) {
    console.error("[City Sync] Error fetching cities without country:", error);
    return [];
  }
}

/**
 * Migrates cities that lack a country reference by matching them to current Bokun data
 * and patching with country, cityCode, and countryCode. Match by cityCode first, then
 * by normalized name only when the name is unique in the product set.
 * Names and published content are left unchanged; only codes/slugs are normalized (no accents).
 */
async function migrateCitiesWithoutCountry(
  allCities: CityFromProduct[]
): Promise<{
  migrated: string[];
  errors: CitySyncResult["errors"];
}> {
  const migrated: string[] = [];
  const errors: CitySyncResult["errors"] = [];

  const toMigrate = await getCitiesWithoutCountry();
  if (toMigrate.length === 0) return { migrated, errors };

  const byCityCode = new Map<string, CityFromProduct>();
  for (const c of allCities) {
    const key = normalizeCityCodeForSlug(c.cityCode).toLowerCase();
    if (!byCityCode.has(key)) byCityCode.set(key, c);
  }

  const nameCount = new Map<string, number>();
  for (const c of allCities) {
    const key = stripAccents((c.name ?? "").trim().toLowerCase());
    if (key) nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }
  const byNameUnique = new Map<string, CityFromProduct>();
  for (const c of allCities) {
    const key = stripAccents((c.name ?? "").trim().toLowerCase());
    if (key && nameCount.get(key) === 1) byNameUnique.set(key, c);
  }

  for (const doc of toMigrate) {
    let match: CityFromProduct | undefined;

    const existingCode =
      doc.cityCode != null && doc.cityCode !== ""
        ? normalizeCityCodeForSlug(doc.cityCode).toLowerCase()
        : null;
    if (existingCode) match = byCityCode.get(existingCode);

    if (!match && doc.name != null && doc.name.trim() !== "") {
      const nameKey = stripAccents(doc.name.trim().toLowerCase());
      match = byNameUnique.get(nameKey);
    }

    if (!match) continue;

    try {
      const countryRef = generateCountryId(match.countryCode);
      await writeClient
        .patch(doc._id)
        .set({
          country: { _type: "reference", _ref: countryRef },
          countryCode: match.countryCode,
          cityCode: match.cityCode,
          name: match.name,
        })
        .commit();

      migrated.push(match.cityCode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push({
        type: "city",
        identifier: match.cityCode,
        error: errorMessage,
      });
      console.error(`[City Sync] Failed to migrate city "${doc._id}":`, error);
    }
  }

  if (migrated.length > 0) {
    console.log(
      `[City Sync] Migrated ${migrated.length} cities without country:`,
      migrated.join(", ")
    );
  }

  return { migrated, errors };
}

/**
 * Queries Sanity to find which cities already exist by cityCode
 *
 * Uses a single GROQ query to efficiently check existence of multiple cities.
 * Uses the read client (cached) for faster performance.
 *
 * @param cityCodes - Array of city codes to check
 * @returns Promise resolving to array of city codes that exist in Sanity
 *
 * @example
 * await getExistingCities(["Madrid", "Biarritz", "Barcelona"])
 * // Returns ["Madrid", "Biarritz"] if Barcelona doesn't exist
 */
export async function getExistingCities(
  cityCodes: string[]
): Promise<string[]> {
  if (cityCodes.length === 0) {
    return [];
  }

  try {
    const existingCities = await client.fetch<Array<{ cityCode: string }>>(
      `*[_type == "city" && cityCode in $cityCodes]{cityCode}`,
      { cityCodes },
      { next: { revalidate: 0 } }
    );

    return existingCities.map((city) => city.cityCode);
  } catch (error) {
    // Log error but return empty array to allow sync to continue
    // This prevents a single query failure from breaking the entire sync
    console.error("[City Sync] Error querying existing cities:", error);
    return [];
  }
}

/**
 * Generates a deterministic document ID for a city based on its cityCode
 *
 * Uses Bokun's cityCode (unique identifier). Format: city-{cityCode.toLowerCase()}.
 * Trims and strips spaces; empty input returns "city-unknown".
 *
 * @param cityCode - City code from Bokun (e.g. Biarritz, Madrid)
 * @returns Deterministic document ID (e.g. "city-biarritz", "city-madrid")
 *
 * @example
 * generateCityId("Biarritz") // Returns "city-biarritz"
 * generateCityId("Madrid") // Returns "city-madrid"
 * generateCityId("NewYork") // Returns "city-newyork"
 */
function generateCityId(cityCode: string): string {
  const slug = normalizeCityCodeForSlug(cityCode).toLowerCase() || "unknown";
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
  countries: CountryFromProduct[]
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
        `[Country Sync] Failed to create country "${countryCode}":`,
        error
      );
    }
  }

  if (result.created.length > 0) {
    console.log(
      `[Country Sync] Created ${result.created.length} countries:`,
      result.created.join(", ")
    );
  }
  if (result.errors.length > 0) {
    console.error(
      `[Country Sync] ${result.errors.length} country error(s):`,
      result.errors.map((e) => `${e.identifier}: ${e.error}`).join("; ")
    );
  }

  return result;
}

/**
 * Creates cities in Sanity that don't already exist
 *
 * Uses `createIfNotExists` to ensure idempotency - safe to call multiple times.
 * Each city gets a deterministic ID from cityCode and includes country reference.
 *
 * @param cities - Array of city objects with cityCode, name, and countryCode
 * @returns Promise resolving to CitySyncResult with created, existing, and errors
 *
 * @example
 * await createCities([{ cityCode: "Biarritz", name: "Biarritz", countryCode: "FR" }])
 * // Creates city document with country reference; result.cities.created includes "Biarritz"
 */
function emptyCitySyncResult(): CitySyncResult {
  return {
    countries: { created: [], updated: [] },
    cities: { created: [], updated: [], existing: [] },
    errors: [],
  };
}

export async function createCities(
  cities: CityFromProduct[]
): Promise<CitySyncResult> {
  const result = emptyCitySyncResult();

  if (cities.length === 0) return result;

  for (const city of cities) {
    try {
      const _id = generateCityId(city.cityCode);
      const countryRef = generateCountryId(city.countryCode);

      await writeClient.createIfNotExists({
        _id,
        _type: "city",
        name: city.name,
        cityCode: city.cityCode,
        countryCode: city.countryCode,
        country: { _type: "reference", _ref: countryRef },
      });

      result.cities.created.push(city.cityCode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push({
        type: "city",
        identifier: city.cityCode,
        error: errorMessage,
      });
      console.error(
        `[City Sync] Failed to create city "${city.cityCode}" (${city.countryCode}):`,
        error
      );
    }
  }

  if (result.cities.created.length > 0) {
    console.log(
      `[City Sync] Created ${result.cities.created.length} cities:`,
      result.cities.created.join(", ")
    );
  }
  if (result.errors.length > 0) {
    console.error(
      `[City Sync] ${result.errors.length} city create error(s):`,
      result.errors.map((e) => `${e.identifier}: ${e.error}`).join("; ")
    );
  }

  return result;
}

/**
 * Main sync function that orchestrates the complete city and country sync process
 *
 * Syncs countries first, then cities (cities reference country documents).
 * 1. Extract and sync countries to Sanity
 * 2. Extract unique cities with country context
 * 3. Check which cities already exist (by cityCode)
 * 4. Create missing cities with country reference
 * 5. Return combined country and city sync results
 *
 * @param products - Array of Bokun products from the API
 * @returns Promise resolving to CitySyncResult with country and city sync details
 */
export async function syncCitiesFromProducts(
  products: BokunProduct[]
): Promise<CitySyncResult> {
  let countryResult: CountrySyncResult = {
    created: [],
    updated: [],
    errors: [],
  };

  try {
    // Step 1: Sync countries first (cities reference country documents)
    const countries = await extractUniqueCountries(products);
    if (countries.length > 0) {
      try {
        countryResult = await syncCountries(countries);
      } catch (err) {
        console.error("[Country Sync] Failed to sync countries:", err);
        countryResult.errors.push({
          type: "country",
          identifier: "SYNC_ERROR",
          error:
            err instanceof Error ? err.message : "Unknown country sync error",
        });
      }
    }

    // Step 2: Extract unique cities with country context (cityCode normalized: no accents)
    const allCities = await extractUniqueCities(products);

    if (allCities.length === 0) {
      return {
        countries: {
          created: countryResult.created,
          updated: countryResult.updated,
        },
        cities: { created: [], updated: [], existing: [] },
        errors: countryResult.errors,
      };
    }

    // Step 3: Migrate existing cities without country (patch with country/cityCode/countryCode)
    const migrationResult = await migrateCitiesWithoutCountry(allCities);

    // Step 4: Check which cities already exist in Sanity (by cityCode)
    const existingCityCodes = await getExistingCities(
      allCities.map((c) => c.cityCode)
    );

    // Step 5: Filter out existing cities to get only new ones
    const citiesToCreate = allCities.filter(
      (city) => !existingCityCodes.includes(city.cityCode)
    );

    // Step 6: Create missing cities (with country reference)
    const createResult = await createCities(citiesToCreate);

    // Step 7: Combine country, migration, and city results
    return {
      countries: {
        created: countryResult.created,
        updated: countryResult.updated,
      },
      cities: {
        created: createResult.cities.created,
        updated: migrationResult.migrated,
        existing: existingCityCodes,
      },
      errors: [
        ...countryResult.errors,
        ...migrationResult.errors,
        ...createResult.errors,
      ],
    };
  } catch (error) {
    console.error("[City Sync] Sync failed:", error);
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
