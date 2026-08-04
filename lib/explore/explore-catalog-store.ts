/**
 * Durable explore catalog snapshot in Upstash Redis.
 *
 * Written by the daily Bokun sync cron; read by explore listing/filter/sort.
 * Returns null / no-ops when Redis is unconfigured so callers can fall back
 * to a live Bokun crawl.
 */

import { Redis } from "@upstash/redis";
import { z } from "zod";

import type { CityCardData } from "@/types/bokun";

/** KV key for the full explore listing snapshot. */
export const EXPLORE_CATALOG_SNAPSHOT_KEY = "explore:catalog:v1";

/** Per-request timeout so explore reads/writes cannot hang on a stuck Upstash call. */
const EXPLORE_CATALOG_REDIS_TIMEOUT_MS = 3_000;

/** Cap Upstash's default 5 retries so a cold Redis miss fails fast into Bokun fallback. */
const EXPLORE_CATALOG_REDIS_RETRIES = 1;

/** Snapshot TTL (> daily cron) so a stalled sync cannot leave an immortal stale key. */
const EXPLORE_CATALOG_SNAPSHOT_TTL_SECONDS = 48 * 60 * 60;

const exploreCatalogCardSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  image: z.string(),
  countryCode: z.string().optional(),
  country: z.string().optional(),
  cityName: z.string().optional(),
  citySlug: z.string().optional(),
  slug: z.string().optional(),
  defaultRateId: z.number().optional(),
});

const exploreCatalogSnapshotSchema = z.array(exploreCatalogCardSchema);

let redisClient: Redis | null | undefined;

/**
 * Resolves Upstash REST credentials from Vercel KV or Upstash env names.
 */
function resolveExploreCatalogRedisCredentials(): {
  url: string;
  token: string;
} | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

/**
 * Returns a singleton Upstash Redis client, or null when credentials are missing.
 *
 * Uses a fresh AbortSignal.timeout per request and bounded retries so
 * `redis.get` / `redis.set` cannot wait indefinitely.
 */
export function getExploreCatalogRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const credentials = resolveExploreCatalogRedisCredentials();
  if (!credentials) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: credentials.url,
    token: credentials.token,
    // Factory: each command needs its own timeout window (a static signal expires once).
    signal: () => AbortSignal.timeout(EXPLORE_CATALOG_REDIS_TIMEOUT_MS),
    retry: {
      retries: EXPLORE_CATALOG_REDIS_RETRIES,
      backoff: (retryCount) => Math.min(100 * 2 ** retryCount, 500),
    },
  });
  return redisClient;
}

/**
 * Clears the cached client — used by tests to inject mocks or reset env changes.
 */
export function resetExploreCatalogRedisClientForTests(): void {
  redisClient = undefined;
}

/**
 * Overrides the Redis client for unit tests.
 *
 * @param client - Mock Redis or null to simulate missing configuration
 */
export function setExploreCatalogRedisClientForTests(
  client: Redis | null,
): void {
  redisClient = client;
}

/**
 * Keeps only listing fields so enrichment (price/rating) is not persisted.
 */
function toSnapshotCard(card: CityCardData): CityCardData {
  return {
    id: card.id,
    title: card.title,
    image: card.image,
    ...(card.countryCode !== undefined
      ? { countryCode: card.countryCode }
      : {}),
    ...(card.country !== undefined ? { country: card.country } : {}),
    ...(card.cityName !== undefined ? { cityName: card.cityName } : {}),
    ...(card.citySlug !== undefined ? { citySlug: card.citySlug } : {}),
    ...(card.slug !== undefined ? { slug: card.slug } : {}),
    ...(card.defaultRateId !== undefined
      ? { defaultRateId: card.defaultRateId }
      : {}),
  };
}

/**
 * Reads the durable explore catalog snapshot from Redis.
 *
 * @returns Snapshot cards, or null when Redis is unset, the key is missing, or the payload is invalid
 */
export async function readExploreCatalogSnapshot(): Promise<
  CityCardData[] | null
> {
  const redis = getExploreCatalogRedis();
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get(EXPLORE_CATALOG_SNAPSHOT_KEY);
    if (value == null) {
      return null;
    }

    const parsed = exploreCatalogSnapshotSchema.safeParse(value);
    if (!parsed.success) {
      console.error(
        "[explore-catalog-store] invalid stored snapshot:",
        parsed.error.issues[0]?.message,
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("[explore-catalog-store] failed to read snapshot", error);
    return null;
  }
}

/**
 * Writes the explore catalog snapshot to Redis.
 *
 * Strips enrichment-only fields so the snapshot stays listing-sized.
 * No-ops when Redis is unconfigured.
 *
 * @param cards - Transformed city cards to persist
 * @returns `true` when the write succeeded; `false` when Redis is unset or the write failed
 */
export async function writeExploreCatalogSnapshot(
  cards: readonly CityCardData[],
): Promise<boolean> {
  const redis = getExploreCatalogRedis();
  if (!redis) {
    return false;
  }

  const snapshot = cards.map(toSnapshotCard);

  try {
    await redis.set(EXPLORE_CATALOG_SNAPSHOT_KEY, snapshot, {
      ex: EXPLORE_CATALOG_SNAPSHOT_TTL_SECONDS,
    });
    return true;
  } catch (error) {
    console.error("[explore-catalog-store] failed to write snapshot", error);
    return false;
  }
}
